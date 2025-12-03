import { Op } from "sequelize";
import sequelize from "../configs/database";
import {
  Order,
  OrderDetail,
  Product,
  ProductSKU,
  AttributeValue,
} from "../models";

class CheckoutError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const normalizeItems = (rawItems = []) => {
  if (!Array.isArray(rawItems) || !rawItems.length) {
    throw new CheckoutError("Giỏ hàng đang trống.");
  }
  return rawItems.map((item) => {
    const skuId = Number(item.skuId);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(skuId) || skuId <= 0) {
      throw new CheckoutError("SKU không hợp lệ.");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new CheckoutError("Số lượng sản phẩm không hợp lệ.");
    }
    return { skuId, quantity };
  });
};

const fetchSkuRecords = async (skuIds, transaction) => {
  const records = await ProductSKU.findAll({
    where: { id: { [Op.in]: skuIds } },
    include: [
      {
        model: Product,
        attributes: ["id", "name", "thumbnailUrl"],
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
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  return records;
};

const buildSkuMap = (skuRecords) => {
  const map = new Map();
  skuRecords.forEach((record) => {
    map.set(Number(record.id), record);
  });
  return map;
};

const createOrderTransaction = async ({
  userId,
  items,
  shippingName,
  shippingPhone,
  shippingAddress,
  paymentMethod = "COD",
  note = null,
}) => {
  if (!shippingName || !shippingPhone || !shippingAddress) {
    throw new CheckoutError("Vui lòng cung cấp đầy đủ thông tin giao hàng.");
  }

  const normalizedItems = normalizeItems(items);
  const skuIds = normalizedItems.map((item) => item.skuId);

  return sequelize.transaction(async (transaction) => {
    const skuRecords = await fetchSkuRecords(skuIds, transaction);
    if (skuRecords.length !== skuIds.length) {
      throw new CheckoutError("Một số sản phẩm không tồn tại hoặc đã bị gỡ.");
    }

    const skuMap = buildSkuMap(skuRecords);
    const enrichedItems = normalizedItems.map((item) => {
      const sku = skuMap.get(item.skuId);
      if (!sku) {
        throw new CheckoutError("Không tìm thấy thông tin SKU.");
      }
      const stockAvailable = Number(sku.stockQuantity) || 0;
      if (item.quantity > stockAvailable) {
        throw new CheckoutError(
          `Sản phẩm "${sku.Product.name}" không đủ tồn kho.`
        );
      }
      const unitPrice = Number(sku.price) || 0;
      return {
        sku,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const totalAmount = enrichedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const order = await Order.create(
      {
        userId: userId || null,
        totalAmount,
        status: "Mới",
        paymentMethod: paymentMethod || "COD",
        isPaid: paymentMethod && paymentMethod !== "COD",
        shippingName,
        shippingPhone,
        shippingAddress,
        note: note || null,
      },
      { transaction }
    );

    const detailPayload = enrichedItems.map((item) => ({
      orderId: order.id,
      productSkuId: item.sku.id,
      productName: item.sku.Product.name,
      color: item.sku.colorValue?.value || null,
      size: item.sku.sizeValue?.value || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    await OrderDetail.bulkCreate(detailPayload, { transaction });

    for (const item of enrichedItems) {
      const nextStock = (Number(item.sku.stockQuantity) || 0) - item.quantity;
      await ProductSKU.update(
        { stockQuantity: nextStock },
        { where: { id: item.sku.id }, transaction }
      );
      await Product.increment("totalSold", {
        by: item.quantity,
        where: { id: item.sku.Product.id },
        transaction,
      });
    }

    const responseOrder = order.get({ plain: true });
    return {
      order: responseOrder,
      totalAmount,
      items: enrichedItems.map((item) => ({
        skuId: item.sku.id,
        productName: item.sku.Product.name,
        color: item.sku.colorValue?.value || null,
        size: item.sku.sizeValue?.value || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    };
  });
};

const restockOrderItems = async (orderId, transaction) => {
  const details = await OrderDetail.findAll({
    where: { orderId },
    include: [
      {
        model: ProductSKU,
        attributes: ["id", "productId"],
      },
    ],
    transaction,
    lock: transaction?.LOCK.UPDATE,
  });

  if (!details.length) {
    return;
  }

  for (const detail of details) {
    if (detail.productSkuId) {
      await ProductSKU.increment("stockQuantity", {
        by: detail.quantity,
        where: { id: detail.productSkuId },
        transaction,
      });
    }
    if (detail.ProductSKU?.productId) {
      await Product.decrement("totalSold", {
        by: detail.quantity,
        where: { id: detail.ProductSKU.productId },
        transaction,
      });
    }
  }
};

export { createOrderTransaction, restockOrderItems, CheckoutError };


