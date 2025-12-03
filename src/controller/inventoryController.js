import {
  Product,
  ProductSKU,
  AttributeValue,
} from "../models";

const listInventory = async (_req, res) => {
  try {
    const skus = await ProductSKU.findAll({
      include: [
        {
          model: Product,
          attributes: ["id", "name", "thumbnailUrl", "totalSold"],
        },
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
        ["productId", "ASC"],
        ["colorValueId", "ASC"],
        ["sizeValueId", "ASC"],
      ],
    });

    return res.json({
      success: true,
      data: skus.map((sku) => ({
        id: sku.id,
        productId: sku.productId,
        productName: sku.Product?.name || "",
        thumbnailUrl: sku.Product?.thumbnailUrl || null,
        color: sku.colorValue?.value || "",
        size: sku.sizeValue?.value || "",
        stockQuantity: Number(sku.stockQuantity) || 0,
        totalSold: Number(sku.Product?.totalSold) || 0,
        price: Number(sku.price) || 0,
      })),
    });
  } catch (error) {
    console.log("listInventory error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải dữ liệu kho.",
    });
  }
};

const getBestSellers = async (_req, res) => {
  try {
    const products = await Product.findAll({
      order: [["totalSold", "DESC"]],
      limit: 10,
      attributes: ["id", "name", "thumbnailUrl", "totalSold"],
    });

    return res.json({
      success: true,
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        thumbnailUrl: product.thumbnailUrl,
        totalSold: Number(product.totalSold) || 0,
      })),
    });
  } catch (error) {
    console.log("getBestSellers error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách bán chạy.",
    });
  }
};

export default {
  listInventory,
  getBestSellers,
};


