import { Category, Product } from "../models";
import cloudinaryService from "../service/cloudinaryService";

const ensureAdmin = (req, res) => {
  const isAdmin =
    req.session &&
    req.session.user &&
    String(req.session.user.roleId) === "1";
  if (!isAdmin) {
    return res.redirect("/signin");
  }
  return null;
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

const renderView = async (req, res, options = {}) => {
  const [products, categories] = await Promise.all([
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
  ]);

  return res.render("admin/products.ejs", {
    products: products.map((product) => product.toJSON()),
    categories,
    editingProduct: options.editingProduct || null,
    errorMessage: options.errorMessage || null,
    formData: options.formData || null,
    successMessage: options.successMessage || null,
  });
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
    ],
  });

  if (!product) {
    return res.redirect("/admin/products?status=notfound");
  }

  const editingProduct = product.toJSON();
  editingProduct.categoryIds = (editingProduct.Categories || []).map(
    (category) => String(category.id)
  );

  return renderView(req, res, { editingProduct });
};

const createProduct = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const {
    name,
    slug,
    description,
    basePrice,
    isActive,
    categoryIds: categoryPayload,
  } = req.body;

  const parsedCategories = parseCategoryIds(categoryPayload);

  if (!name || !name.trim()) {
    return renderView(req, res, {
      errorMessage: "Vui lòng nhập tên sản phẩm.",
      formData: {
        ...req.body,
        categoryIds: parsedCategories.map(String),
      },
    });
  }

  try {
    let thumbnailUrl = null;
    if (req.file && req.file.buffer) {
      const upload = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: "moda-studio/products",
      });
      thumbnailUrl = upload?.secure_url || null;
    }

    const product = await Product.create({
      name: name.trim(),
      slug: slug && slug.trim() ? slug.trim() : normalizeSlug(name),
      description: description || null,
      basePrice: Number(basePrice) || 0,
      isActive: isActive === "on",
      thumbnailUrl,
    });

    if (parsedCategories.length) {
      await product.setCategories(parsedCategories);
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
  } = req.body;

  const parsedCategories = parseCategoryIds(categoryPayload);

  try {
    let thumbnailUrl = product.thumbnailUrl;
    if (req.file && req.file.buffer) {
      const upload = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: "moda-studio/products",
      });
      thumbnailUrl = upload?.secure_url || thumbnailUrl;
    }

    await product.update({
      name: name && name.trim() ? name.trim() : product.name,
      slug:
        slug && slug.trim()
          ? slug.trim()
          : product.slug || normalizeSlug(name || product.name),
      description: description ?? product.description,
      basePrice:
        basePrice && !Number.isNaN(Number(basePrice))
          ? Number(basePrice)
          : product.basePrice,
      isActive: isActive === "on",
      thumbnailUrl,
    });

    await product.setCategories(parsedCategories);

    return res.redirect("/admin/products?status=updated");
  } catch (error) {
    console.log("updateProduct error:", error);
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
    });
  }
};

const deleteProduct = async (req, res) => {
  if (ensureAdmin(req, res)) return;
  const { id } = req.params;
  try {
    await Product.destroy({ where: { id } });
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

