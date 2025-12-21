import {
  Category,
  Product,
  ProductGallery,
  ProductColorImage,
  ProductSKU,
  AttributeValue,
} from "../../models";
import sequelize from "../../configs/database";
import cloudinaryService from "../../service/cloudinaryService";
import { logCreate, logUpdate, logDelete } from "../../service/auditLogger";

const COLOR_ATTRIBUTE_ID = Number(process.env.COLOR_ATTRIBUTE_ID || 1);
const SIZE_ATTRIBUTE_ID = Number(process.env.SIZE_ATTRIBUTE_ID || 2);

const ensureAdmin = (req, res) => {
  if (!req.session || !req.session.user) {
    res.redirect("/signin");
    return true;
  }
  const roleId = String(req.session.user.roleId);
  // Allow Super Admin (0) and Admin (1)
  if (roleId !== "0" && roleId !== "1") {
    res.redirect("/admin/dashboard?status=forbidden");
    return true;
  }
  return false;
};

const normalizeSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-");

const getCategories = () =>
  Category.findAll({
    order: [
      ["parentId", "ASC"],
      ["name", "ASC"],
    ],
    raw: true,
  });

// Thứ tự chuẩn cho sizes
const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL'];

const getAttributeOptions = async () => {
  const [colors, sizesRaw] = await Promise.all([
    AttributeValue.findAll({
      where: { attributeId: COLOR_ATTRIBUTE_ID },
      order: [
        ["value", "ASC"],
        ["id", "ASC"],
      ],
      raw: true,
    }),
    AttributeValue.findAll({
      where: { attributeId: SIZE_ATTRIBUTE_ID },
      raw: true,
    }),
  ]);
  
  // Sắp xếp sizes theo thứ tự chuẩn: S, M, L, XL, XXL
  const sizes = sizesRaw.sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.value);
    const indexB = SIZE_ORDER.indexOf(b.value);
    // Nếu không tìm thấy trong SIZE_ORDER, đẩy xuống cuối
    if (indexA === -1 && indexB === -1) return a.value.localeCompare(b.value);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  
  return { colors, sizes };
};

const renderView = async (req, res, options = {}) => {
  const [products, categories, attributeOptions] = await Promise.all([
    Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
    }),
    getCategories(),
    getAttributeOptions(),
  ]);

  return res.render("admin/products.ejs", {
    products: products.map((product) => product.toJSON()),
    categories,
    editingProduct: options.editingProduct || null,
    errorMessage: options.errorMessage || null,
    formData: options.formData || null,
    successMessage: options.successMessage || null,
    colorOptions: attributeOptions.colors,
    sizeOptions: attributeOptions.sizes,
    inventorySnapshot: options.inventorySnapshot || null,
    currentUser: req.session?.user || null,
    theme: req.session?.theme || "light",
  });
};

const uploadImageFromFile = async (file) => {
  if (!file || !file.buffer) return null;
  const uploadResult = await cloudinaryService.uploadBuffer(file.buffer, {
    folder: "moda-studio/products",
  });
  return uploadResult?.secure_url || null;
};

const syncProductGalleries = async (
  productId,
  galleryFiles = [],
  transaction
) => {
  if (!galleryFiles.length) return;
  await ProductGallery.destroy({ where: { productId }, transaction });
  const payload = [];
  for (let index = 0; index < galleryFiles.length; index += 1) {
    const file = galleryFiles[index];
    const imageUrl = await uploadImageFromFile(file);
    if (imageUrl) {
      payload.push({
        productId,
        imageUrl,
        displayOrder: index + 1,
      });
    }
  }
  if (payload.length) {
    await ProductGallery.bulkCreate(payload, { transaction });
  }
};

const syncProductColorImages = async (
  productId,
  colorIds = [],
  colorFiles = [],
  transaction
) => {
  if (!colorIds.length || !colorFiles.length) return;
  for (let index = 0; index < colorIds.length; index += 1) {
    const colorId = Number(colorIds[index]);
    const file = colorFiles[index];
    if (!file || Number.isNaN(colorId)) {
      continue;
    }
    const imageUrl = await uploadImageFromFile(file);
    if (!imageUrl) continue;
    await ProductColorImage.destroy({
      where: { productId, colorValueId: colorId },
      transaction,
    });
    await ProductColorImage.create(
      { productId, colorValueId: colorId, imageUrl },
      { transaction }
    );
  }
};

const buildSkuKey = (colorValueId, sizeValueId) =>
  `${colorValueId}-${sizeValueId}`;

const parseInventoryPayload = (rawInventory, basePrice) => {
  if (!rawInventory || typeof rawInventory !== "object") return [];
  const entries = [];
  Object.entries(rawInventory).forEach(([colorKey, sizePayload]) => {
    const colorValueId = Number(colorKey);
    if (Number.isNaN(colorValueId) || typeof sizePayload !== "object") {
      return;
    }
    Object.entries(sizePayload).forEach(([sizeKey, cell]) => {
      const sizeValueId = Number(sizeKey);
      if (Number.isNaN(sizeValueId) || typeof cell !== "object") {
        return;
      }
      const stockRaw = cell.stock;
      const priceRaw = cell.price;
      const stockQuantity = Number(stockRaw);
      const priceValue =
        priceRaw === undefined || priceRaw === ""
          ? Number(basePrice) || 0
          : Number(priceRaw);
      // Luôn tạo entry cho mọi size, kể cả khi stock = 0 hoặc để trống
      entries.push({
        colorValueId,
        sizeValueId,
        stockQuantity: Number.isNaN(stockQuantity)
          ? 0
          : Math.max(0, Math.floor(stockQuantity)),
        price: Number.isNaN(priceValue) ? Number(basePrice) || 0 : priceValue,
      });
    });
  });
  return entries;
};

const syncInventoryMatrix = async (
  productId,
  inventoryEntries,
  basePrice,
  transaction
) => {
  if (!Array.isArray(inventoryEntries)) return;
  const existingSkus = await ProductSKU.findAll({
    where: { productId },
    transaction,
  });
  const existingMap = new Map();
  existingSkus.forEach((sku) => {
    const key = buildSkuKey(sku.colorValueId, sku.sizeValueId);
    existingMap.set(key, sku);
  });

  const desiredKeys = new Set();
  for (const entry of inventoryEntries) {
    if (Number.isNaN(entry.colorValueId) || Number.isNaN(entry.sizeValueId)) {
      continue;
    }
    const key = buildSkuKey(entry.colorValueId, entry.sizeValueId);
    desiredKeys.add(key);
    const nextPrice =
      Number(entry.price) && Number(entry.price) > 0
        ? Number(entry.price)
        : Number(basePrice) || 0;
    const nextStock =
      Number(entry.stockQuantity) && Number(entry.stockQuantity) > 0
        ? Math.floor(Number(entry.stockQuantity))
        : 0;
    if (existingMap.has(key)) {
      await ProductSKU.update(
        { price: nextPrice, stockQuantity: nextStock },
        { where: { id: existingMap.get(key).id }, transaction }
      );
    } else {
      // Luôn tạo SKU mới cho tất cả color/size, kể cả khi stock = 0
      await ProductSKU.create(
        {
          productId,
          skuCode: `SP${productId}-${entry.colorValueId}-${entry.sizeValueId}`,
          colorValueId: entry.colorValueId,
          sizeValueId: entry.sizeValueId,
          price: nextPrice,
          stockQuantity: nextStock,
        },
        { transaction }
      );
    }
  }

  const removableIds = [];
  existingMap.forEach((sku, key) => {
    if (!desiredKeys.has(key)) {
      removableIds.push(sku.id);
    }
  });
  if (removableIds.length) {
    await ProductSKU.destroy({ where: { id: removableIds }, transaction });
  }
};

const buildInventorySnapshot = async (productId) => {
  const snapshot = {};
  const skuRows = await ProductSKU.findAll({
    where: { productId },
    raw: true,
  });
  skuRows.forEach((sku) => {
    const colorKey = String(sku.colorValueId);
    if (!snapshot[colorKey]) {
      snapshot[colorKey] = {};
    }
    snapshot[colorKey][String(sku.sizeValueId)] = {
      price: Number(sku.price) || 0,
      stock: Number(sku.stockQuantity) || 0,
    };
  });
  return snapshot;
};

const parseCategoryIds = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
  }
  return [Number(input)].filter((id) => !Number.isNaN(id));
};

const listProducts = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { status } = req.query;
  let successMessage = null;
  if (status === "created") successMessage = "Đã tạo sản phẩm mới.";
  if (status === "updated") successMessage = "Cập nhật sản phẩm thành công.";
  if (status === "deleted") successMessage = "Đã xóa sản phẩm.";
  return renderView(req, res, { successMessage });
};

const renderEditProduct = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { id } = req.params;
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        attributes: ["id"],
        through: { attributes: [] },
      },
      {
        model: ProductGallery,
        attributes: ["id", "imageUrl", "displayOrder"],
      },
      {
        model: ProductColorImage,
        attributes: ["id", "colorValueId", "imageUrl"],
      },
      {
        model: ProductSKU,
        attributes: [
          "id",
          "skuCode",
          "price",
          "stockQuantity",
          "colorValueId",
          "sizeValueId",
        ],
      },
    ],
  });

  if (!product) {
    return res.redirect("/admin/products?status=notfound");
  }

  const editingProduct = product.toJSON();
  editingProduct.categoryIds = (editingProduct.Categories || []).map(
    (category) => String(category.id)
  );
  editingProduct.galleries =
    editingProduct.ProductGalleries?.map((gallery) => ({
      id: gallery.id,
      imageUrl: gallery.imageUrl,
      displayOrder: gallery.displayOrder,
    })) || [];
  editingProduct.colorImages =
    editingProduct.ProductColorImages?.map((image) => ({
      id: image.id,
      colorValueId: image.colorValueId,
      imageUrl: image.imageUrl,
    })) || [];
  delete editingProduct.ProductGalleries;
  delete editingProduct.ProductColorImages;
  delete editingProduct.ProductSKUs;
  delete editingProduct.Categories;

  const inventorySnapshot = await buildInventorySnapshot(product.id);

  return renderView(req, res, { editingProduct, inventorySnapshot });
};

const createProduct = async (req, res) => {
  console.log(
    "[createProduct] Session user:",
    req.session?.user?.email,
    "Role:",
    req.session?.user?.roleId
  );
  if (ensureAdmin(req, res)) return;
  const {
    name,
    slug,
    description,
    basePrice,
    isActive,
    categoryIds: categoryPayload,
    inventory = null,
    colorImageColorIds = [],
  } = req.body;

  const parsedCategories = parseCategoryIds(categoryPayload);

  const thumbnailFile = req.files?.thumbnail?.[0] || null;
  const galleryFiles = req.files?.galleryImages || [];
  const colorImageFiles = req.files?.colorImageFiles || [];
  const normalizedColorImageIds = Array.isArray(colorImageColorIds)
    ? colorImageColorIds
    : colorImageColorIds
    ? [colorImageColorIds]
    : [];

  if (!name || !name.trim()) {
    return renderView(req, res, {
      errorMessage: "Vui lòng nhập tên sản phẩm.",
      formData: {
        ...req.body,
        categoryIds: parsedCategories.map(String),
      },
    });
  }

  if (galleryFiles.length !== 3) {
    return renderView(req, res, {
      errorMessage: "Vui lòng tải đủ 3 ảnh cho bộ sưu tập demo.",
      formData: {
        ...req.body,
        categoryIds: parsedCategories.map(String),
      },
    });
  }

  const hasInventoryPayload =
    inventory && typeof inventory === "object" && Object.keys(inventory).length;
  const inventoryEntries = hasInventoryPayload
    ? parseInventoryPayload(inventory, basePrice)
    : [];

  try {
    let createdProductId = null;

    await sequelize.transaction(async (transaction) => {
      const thumbnailUrl = await uploadImageFromFile(thumbnailFile);

      const product = await Product.create(
        {
          name: name.trim(),
          slug: slug && slug.trim() ? slug.trim() : normalizeSlug(name),
          description: description || null,
          basePrice: Number(basePrice) || 0,
          isActive: isActive === "on",
          thumbnailUrl,
        },
        { transaction }
      );

      createdProductId = product.id;

      if (parsedCategories.length) {
        await product.setCategories(parsedCategories, { transaction });
      }

      if (galleryFiles.length) {
        await syncProductGalleries(product.id, galleryFiles, transaction);
      }

      if (colorImageFiles.length && normalizedColorImageIds.length) {
        await syncProductColorImages(
          product.id,
          normalizedColorImageIds,
          colorImageFiles,
          transaction
        );
      }

      if (hasInventoryPayload) {
        await syncInventoryMatrix(
          product.id,
          inventoryEntries,
          Number(basePrice) || 0,
          transaction
        );
      }
    });

    // Log product creation
    if (createdProductId) {
      logCreate(req, "products", createdProductId, { name, slug, basePrice });
    }

    return res.redirect("/admin/products?status=created");
  } catch (error) {
    console.log("createProduct error:", error);
    return renderView(req, res, {
      errorMessage: "Không thể tạo sản phẩm.",
      formData: {
        ...req.body,
        categoryIds: parsedCategories.map(String),
      },
    });
  }
};

const updateProduct = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { id } = req.params;
  const product = await Product.findByPk(id);

  if (!product) {
    return res.redirect("/admin/products?status=notfound");
  }

  const {
    name,
    slug,
    description,
    basePrice,
    isActive,
    categoryIds: categoryPayload,
    inventory = null,
    colorImageColorIds = [],
  } = req.body;

  const parsedCategories = parseCategoryIds(categoryPayload);
  const thumbnailFile = req.files?.thumbnail?.[0] || null;
  const galleryFiles = req.files?.galleryImages || [];
  const colorImageFiles = req.files?.colorImageFiles || [];
  const normalizedColorImageIds = Array.isArray(colorImageColorIds)
    ? colorImageColorIds
    : colorImageColorIds
    ? [colorImageColorIds]
    : [];

  if (galleryFiles.length && galleryFiles.length !== 3) {
    const inventorySnapshot = await buildInventorySnapshot(product.id);
    return renderView(req, res, {
      errorMessage: "Vui lòng tải đủ 3 ảnh cho bộ sưu tập demo.",
      editingProduct: {
        id,
        name,
        slug,
        description,
        basePrice,
        isActive,
        thumbnailUrl: product.thumbnailUrl,
        categoryIds: parsedCategories.map(String),
      },
      inventorySnapshot,
    });
  }

  const hasInventoryPayload =
    inventory && typeof inventory === "object" && Object.keys(inventory).length;
  const inventoryEntries = hasInventoryPayload
    ? parseInventoryPayload(
        inventory,
        basePrice && !Number.isNaN(Number(basePrice))
          ? Number(basePrice)
          : product.basePrice
      )
    : [];

  try {
    await sequelize.transaction(async (transaction) => {
      const uploadedThumbnail = await uploadImageFromFile(thumbnailFile);
      const nextBasePrice =
        basePrice && !Number.isNaN(Number(basePrice))
          ? Number(basePrice)
          : product.basePrice;

      await product.update(
        {
          name: name && name.trim() ? name.trim() : product.name,
          slug:
            slug && slug.trim()
              ? slug.trim()
              : product.slug || normalizeSlug(name || product.name),
          description: description ?? product.description,
          basePrice: nextBasePrice,
          isActive: isActive === "on",
          thumbnailUrl: uploadedThumbnail || product.thumbnailUrl,
        },
        { transaction }
      );

      await product.setCategories(parsedCategories, { transaction });

      if (galleryFiles.length) {
        await syncProductGalleries(product.id, galleryFiles, transaction);
      }

      if (colorImageFiles.length && normalizedColorImageIds.length) {
        await syncProductColorImages(
          product.id,
          normalizedColorImageIds,
          colorImageFiles,
          transaction
        );
      }

      if (hasInventoryPayload) {
        await syncInventoryMatrix(
          product.id,
          inventoryEntries,
          nextBasePrice,
          transaction
        );
      }
    });

    // Log product update
    logUpdate(
      req,
      "products",
      id,
      { name: product.name, slug: product.slug, basePrice: product.basePrice },
      { name, slug, basePrice }
    );

    return res.redirect("/admin/products?status=updated");
  } catch (error) {
    console.log("updateProduct error:", error);
    const inventorySnapshot = await buildInventorySnapshot(product.id);
    return renderView(req, res, {
      editingProduct: {
        id,
        name,
        slug,
        description,
        basePrice,
        isActive,
        thumbnailUrl: product.thumbnailUrl,
        categoryIds: parsedCategories.map(String),
      },
      errorMessage: "Không thể cập nhật sản phẩm.",
      inventorySnapshot,
    });
  }
};

const deleteProduct = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { id } = req.params;
  try {
    // Get product data before deletion for audit log
    const product = await Product.findByPk(id, { raw: true });

    await Product.destroy({ where: { id } });

    // Log product deletion
    if (product) {
      logDelete(req, "products", id, {
        name: product.name,
        slug: product.slug,
      });
    }

    return res.redirect("/admin/products?status=deleted");
  } catch (error) {
    console.log("deleteProduct error:", error);
    return res.redirect("/admin/products?status=error");
  }
};

export default {
  listProducts,
  renderEditProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
