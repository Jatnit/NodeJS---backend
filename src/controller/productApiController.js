import { Op } from "sequelize";
import sequelize from "../configs/database";
import {
  Product,
  ProductSKU,
  Category,
  AttributeValue,
  ProductGallery,
  ProductColorImage,
  Review,
  ReviewImage,
  User,
} from "../models";

const MAX_LIMIT = 60;
const DEFAULT_LIMIT = 9;

const parseIdList = (rawValue) => {
  if (!rawValue || typeof rawValue !== "string") return [];
  return rawValue
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const collectProductIds = (currentIds, nextIds) => {
  if (!nextIds) return currentIds;
  if (!currentIds) {
    return Array.from(new Set(nextIds));
  }
  const nextSet = new Set(nextIds);
  return currentIds.filter((id) => nextSet.has(id));
};

const findProductIdsByPrice = async (minPrice, maxPrice) => {
  if (minPrice === null && maxPrice === null) {
    return null;
  }

  const priceWhere = {};
  if (minPrice !== null) {
    priceWhere[Op.gte] = minPrice;
  }
  if (maxPrice !== null) {
    priceWhere[Op.lte] = maxPrice;
  }

  const rows = await ProductSKU.findAll({
    attributes: ["productId"],
    where: { price: priceWhere },
    group: ["productId"],
    raw: true,
  });

  return rows.map((row) => row.productId);
};

const findProductIdsByAttributes = async (colorIds, sizeIds) => {
  if (!colorIds.length && !sizeIds.length) {
    return null;
  }

  const where = {};
  if (colorIds.length) {
    where.colorValueId = { [Op.in]: colorIds };
  }
  if (sizeIds.length) {
    where.sizeValueId = { [Op.in]: sizeIds };
  }

  const rows = await ProductSKU.findAll({
    attributes: ["productId"],
    where,
    group: ["productId"],
    raw: true,
  });

  return rows.map((row) => row.productId);
};

const buildSortClause = (sort) => {
  switch (sort) {
    case "price_asc":
      return [
        [
          sequelize.literal(
            "(SELECT MIN(ps.Price) FROM ProductSKUs ps WHERE ps.ProductId = Products.Id)"
          ),
          "ASC",
        ],
      ];
    case "price_desc":
      return [
        [
          sequelize.literal(
            "(SELECT MAX(ps.Price) FROM ProductSKUs ps WHERE ps.ProductId = Products.Id)"
          ),
          "DESC",
        ],
      ];
    case "newest":
    default:
      return [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ];
  }
};

const ensureAdminApi = (req, res) => {
  const user = req.session?.user;
  if (!user || String(user.roleId) !== "1") {
    res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tính năng này.",
    });
    return null;
  }
  return user;
};

const mapCategories = (categories = []) =>
  categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));

const buildPriceRange = (skus = [], fallbackPrice = 0) => {
  const priceList = skus
    .map((sku) => Number(sku.price))
    .filter((price) => Number.isFinite(price));
  if (!priceList.length) {
    return { min: fallbackPrice, max: fallbackPrice };
  }
  return {
    min: Math.min(...priceList),
    max: Math.max(...priceList),
  };
};

const formatProductPayload = (product) => {
  const basePrice = Number(product.basePrice) || 0;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    thumbnailUrl: product.thumbnailUrl,
    basePrice,
    priceRange: buildPriceRange(product.ProductSKUs || [], basePrice),
    categories: mapCategories(product.Categories || []),
  };
};

const mapGalleries = (product) => {
  const galleries = (product.ProductGalleries || [])
    .slice()
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map((item) => item.imageUrl)
    .filter(Boolean);
  if (galleries.length) {
    return galleries;
  }
  return product.thumbnailUrl ? [product.thumbnailUrl] : [];
};

const mapColorImages = (product) =>
  (product.ProductColorImages || []).map((item) => ({
    id: item.id,
    colorValueId: item.colorValueId,
    colorLabel: item.colorValue?.value || null,
    colorCode: item.colorValue?.code || null,
    imageUrl: item.imageUrl,
  }));

const mapSkuRecords = (product) =>
  (product.ProductSKUs || []).map((sku) => ({
    id: sku.id,
    skuCode: sku.skuCode,
    colorValueId: sku.colorValueId,
    sizeValueId: sku.sizeValueId,
    color: {
      id: sku.colorValueId,
      label: sku.colorValue?.value || null,
      code: sku.colorValue?.code || null,
    },
    size: {
      id: sku.sizeValueId,
      label: sku.sizeValue?.value || null,
    },
    price: Number(sku.price),
    stockQuantity: Number(sku.stockQuantity) || 0,
  }));

const collectAttributeOptionsFromSkus = (skus = []) => {
  const colors = new Map();
  const sizes = new Map();

  skus.forEach((sku) => {
    if (sku.color?.id) {
      colors.set(sku.color.id, {
        id: sku.color.id,
        label: sku.color.label,
        code: sku.color.code,
      });
    }
    if (sku.size?.id) {
      sizes.set(sku.size.id, {
        id: sku.size.id,
        label: sku.size.label,
      });
    }
  });

  return {
    colors: Array.from(colors.values()),
    sizes: Array.from(sizes.values()),
  };
};

const buildProductDetailPayload = (product) => {
  const basePayload = formatProductPayload(product);
  const galleries = mapGalleries(product);
  const colorImages = mapColorImages(product);
  const skus = mapSkuRecords(product);
  const attributes = collectAttributeOptionsFromSkus(skus);

  return {
    ...basePayload,
    galleries,
    colorImages,
    skus,
    attributes,
  };
};

const summarizeReviews = (reviews) => {
  if (!reviews || !reviews.length) {
    return {
      summary: {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      items: [],
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let ratingSum = 0;

  reviews.forEach((review) => {
    const rating = Number(review.rating) || 0;
    ratingSum += rating;
    if (distribution[rating] !== undefined) {
      distribution[rating] += 1;
    }
  });

  const totalReviews = reviews.length;
  const averageRating = ratingSum / totalReviews;

  const items = reviews
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 6)
    .map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      author: review.User?.username || "Ẩn danh",
      createdAt: review.createdAt,
      images: (review.ReviewImages || []).map((image) => image.imageUrl),
    }));

  return {
    summary: {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
      distribution,
    },
    items,
  };
};

const getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      parseInt(req.query.limit, 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const offset = (page - 1) * limit;

    const categoryIds = parseIdList(req.query.categories || req.query.category);
    const colorValueIds = parseIdList(req.query.colors);
    const sizeValueIds = parseIdList(req.query.sizes);
    const minPrice = parseNumber(req.query.minPrice);
    const maxPrice = parseNumber(req.query.maxPrice);
    const sort = (req.query.sort || "newest").toLowerCase();

    let filteredProductIds = null;

    const attributeProductIds = await findProductIdsByAttributes(
      colorValueIds,
      sizeValueIds
    );
    if (attributeProductIds) {
      filteredProductIds = collectProductIds(
        filteredProductIds,
        attributeProductIds
      );
    }

    const priceProductIds = await findProductIdsByPrice(minPrice, maxPrice);
    if (priceProductIds) {
      filteredProductIds = collectProductIds(
        filteredProductIds,
        priceProductIds
      );
    }

    if (filteredProductIds && filteredProductIds.length === 0) {
      return res.json({
        data: [],
        pagination: { total: 0, page, totalPages: 0 },
      });
    }

    const whereClause = { isActive: true };
    if (filteredProductIds) {
      whereClause.id = { [Op.in]: filteredProductIds };
    }

    const categoryInclude = {
      model: Category,
      attributes: ["id", "name", "slug"],
      through: { attributes: [] },
    };

    if (categoryIds.length) {
      categoryInclude.where = { id: { [Op.in]: categoryIds } };
      categoryInclude.required = true;
    }

    const productSkusInclude = {
      model: ProductSKU,
      attributes: [
        "id",
        "price",
        "stockQuantity",
        "colorValueId",
        "sizeValueId",
      ],
    };

    const products = await Product.findAndCountAll({
      where: whereClause,
      include: [categoryInclude, productSkusInclude],
      distinct: true,
      limit,
      offset,
      order: buildSortClause(sort),
    });

    const data = products.rows.map((product) =>
      formatProductPayload(product.toJSON())
    );
    const total =
      typeof products.count === "number"
        ? products.count
        : products.count.length;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.json({
      data,
      pagination: {
        total,
        page,
        totalPages,
      },
    });
  } catch (error) {
    console.log("getProducts API error:", error);
    return res.status(500).json({
      message: "Không thể tải danh sách sản phẩm.",
    });
  }
};

export default {
  getProducts,

  /**
   * Check if product name or slug already exists
   * GET /api/products/check-duplicate?name=xxx&slug=xxx&excludeId=123
   */
  async checkProductDuplicate(req, res) {
    try {
      const { name, slug, excludeId } = req.query;
      const result = { nameExists: false, slugExists: false };

      if (name) {
        const whereClause = { name: name.trim() };
        if (excludeId) {
          whereClause.id = { [Op.ne]: Number(excludeId) };
        }
        const existingByName = await Product.findOne({ where: whereClause });
        result.nameExists = !!existingByName;
      }

      if (slug) {
        const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
        const whereClause = { slug: normalizedSlug };
        if (excludeId) {
          whereClause.id = { [Op.ne]: Number(excludeId) };
        }
        const existingBySlug = await Product.findOne({ where: whereClause });
        result.slugExists = !!existingBySlug;
      }

      return res.json({
        success: true,
        ...result,
        message: result.nameExists
          ? "Tên sản phẩm đã tồn tại"
          : result.slugExists
          ? "Slug đã tồn tại"
          : null,
      });
    } catch (error) {
      console.log("checkProductDuplicate error:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể kiểm tra trùng lặp.",
      });
    }
  },

  async getProductDetail(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        where: { id, isActive: true },
        include: [
          {
            model: Category,
            attributes: ["id", "name", "slug"],
            through: { attributes: [] },
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
            include: [
              {
                model: AttributeValue,
                as: "colorValue",
                attributes: ["id", "value", "code"],
              },
              {
                model: AttributeValue,
                as: "sizeValue",
                attributes: ["id", "value"],
              },
            ],
          },
          {
            model: ProductGallery,
            attributes: ["id", "imageUrl", "displayOrder"],
          },
          {
            model: ProductColorImage,
            attributes: ["id", "colorValueId", "imageUrl"],
            include: [
              {
                model: AttributeValue,
                as: "colorValue",
                attributes: ["id", "value", "code"],
              },
            ],
          },
          {
            model: Review,
            attributes: ["id", "rating", "comment", "createdAt", "orderId"],
            include: [
              { model: User, attributes: ["username"] },
              { model: ReviewImage, attributes: ["id", "imageUrl"] },
            ],
          },
        ],
      });

      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
      }

      const recommendations = await Product.findAll({
        where: {
          isActive: true,
          id: { [Op.ne]: id },
        },
        include: [
          {
            model: Category,
            attributes: ["id", "name", "slug"],
            through: { attributes: [] },
          },
          {
            model: ProductSKU,
            attributes: ["price"],
          },
        ],
        order: sequelize.random(),
        limit: 4,
      });

      const recommendationPayload = recommendations.map((rec) => {
        const plain = rec.toJSON();
        const formatted = formatProductPayload(plain);
        return {
          id: formatted.id,
          name: formatted.name,
          thumbnailUrl: formatted.thumbnailUrl,
          priceRange: formatted.priceRange,
          categories: formatted.categories,
        };
      });

      const detailPayload = buildProductDetailPayload(product.toJSON());
      const reviewPayload = summarizeReviews(
        (product.Reviews || []).map((review) => review.toJSON())
      );

      return res.json({
        data: detailPayload,
        recommendations: recommendationPayload,
        reviews: reviewPayload,
      });
    } catch (error) {
      console.log("getProductDetail error:", error);
      return res.status(500).json({
        message: "Không thể tải thông tin sản phẩm.",
      });
    }
  },
  async getStockMatrix(req, res) {
    if (!ensureAdminApi(req, res)) {
      return;
    }
    const { id } = req.params;
    try {
      const product = await Product.findByPk(id, {
        attributes: ["id", "name"],
      });
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sản phẩm." });
      }

      const skuRecords = await ProductSKU.findAll({
        where: { productId: id },
        attributes: ["id", "stockQuantity", "colorValueId", "sizeValueId"],
        include: [
          {
            model: AttributeValue,
            as: "colorValue",
            attributes: ["id", "value"],
          },
          {
            model: AttributeValue,
            as: "sizeValue",
            attributes: ["id", "value"],
          },
        ],
        order: [
          ["colorValueId", "ASC"],
          ["sizeValueId", "ASC"],
        ],
      });

      const colorMap = new Map();
      const sizeMap = new Map();
      const cellMap = new Map();

      skuRecords.forEach((record) => {
        const plain = record.get({ plain: true });
        const colorAttr = plain.colorValue;
        const sizeAttr = plain.sizeValue;
        if (!colorAttr || !sizeAttr) {
          return;
        }
        colorMap.set(colorAttr.id, {
          id: colorAttr.id,
          label: colorAttr.value,
        });
        sizeMap.set(sizeAttr.id, {
          id: sizeAttr.id,
          label: sizeAttr.value,
        });
        const key = `${colorAttr.id}-${sizeAttr.id}`;
        cellMap.set(key, {
          skuId: plain.id,
          quantity: Number(plain.stockQuantity) || 0,
        });
      });

      const colors = Array.from(colorMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );
      const sizes = Array.from(sizeMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      const cells = [];
      colors.forEach((color) => {
        sizes.forEach((size) => {
          const key = `${color.id}-${size.id}`;
          const cell = cellMap.get(key);
          cells.push({
            key,
            colorId: color.id,
            colorLabel: color.label,
            sizeId: size.id,
            sizeLabel: size.label,
            skuId: cell ? cell.skuId : null,
            quantity: cell ? cell.quantity : 0,
          });
        });
      });

      return res.json({
        success: true,
        data: {
          productId: product.id,
          productName: product.name,
          colors,
          sizes,
          cells,
        },
      });
    } catch (error) {
      console.log("getStockMatrix error:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể tải tồn kho sản phẩm.",
      });
    }
  },
  async updateStockMatrix(req, res) {
    if (!ensureAdminApi(req, res)) {
      return;
    }
    const { id } = req.params;
    const { updates } = req.body || {};

    if (!Array.isArray(updates) || !updates.length) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng gửi dữ liệu cập nhật hợp lệ.",
      });
    }

    try {
      const product = await Product.findByPk(id, { attributes: ["id"] });
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sản phẩm." });
      }

      const skuRecords = await ProductSKU.findAll({
        where: { productId: id },
        attributes: ["id", "stockQuantity"],
      });
      const skuMap = new Map(
        skuRecords.map((sku) => [Number(sku.id), sku.stockQuantity])
      );

      const normalizedUpdates = updates
        .map((item) => ({
          skuId: Number(item.skuId),
          quantity: Number(item.quantity),
        }))
        .filter(
          (item) =>
            Number.isFinite(item.skuId) &&
            skuMap.has(item.skuId) &&
            Number.isFinite(item.quantity)
        )
        .map((item) => ({
          skuId: item.skuId,
          quantity: item.quantity < 0 ? 0 : Math.floor(item.quantity),
        }));

      if (!normalizedUpdates.length) {
        return res.status(400).json({
          success: false,
          message: "Không có dữ liệu hợp lệ để cập nhật.",
        });
      }

      await sequelize.transaction(async (transaction) => {
        for (const update of normalizedUpdates) {
          await ProductSKU.update(
            { stockQuantity: update.quantity },
            {
              where: { id: update.skuId, productId: id },
              transaction,
            }
          );
        }
      });

      return res.json({
        success: true,
        message: "Đã cập nhật tồn kho thành công.",
        updated: normalizedUpdates.length,
      });
    } catch (error) {
      console.log("updateStockMatrix error:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể cập nhật tồn kho.",
      });
    }
  },
};
