import sequelize from "../../configs/database";
import {
  Order,
  OrderDetail,
  ProductSKU,
  Product,
  User,
  AttributeValue,
} from "../../models";
import {
  CheckoutError,
  createOrderTransaction,
  restockOrderItems,
} from "../../service/orderService";
import { logUpdate } from "../../service/auditLogger";

const ORDER_STATUSES = [
  "Mới",
  "Đang xử lý",
  "Đang giao",
  "Hoàn thành",
  "Đã hủy",
];

const formatOrderSummary = (record) => ({
  id: record.id,
  code: `#${String(record.id).padStart(5, "0")}`,
  status: record.status,
  totalAmount: Number(record.totalAmount) || 0,
  paymentMethod: record.paymentMethod,
  orderDate: record.orderDate,
  shippingName: record.shippingName,
  user: record.User
    ? {
        id: record.User.id,
        username: record.User.username,
        email: record.User.email,
        fullName: record.User.fullName,
      }
    : null,
});

const checkout = async (req, res) => {
  try {
    const {
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      paymentMethod,
      note,
    } = req.body || {};

    const userId =
      req.user?.id ||
      req.session?.user?.id ||
      (req.body && Number(req.body.userId)) ||
      null;

    const result = await createOrderTransaction({
      userId,
      items,
      shippingName,
      shippingPhone,
      shippingAddress,
      paymentMethod,
      note,
    });

    if (req.session) {
      req.session.cart = { items: [], subtotal: 0 };
    }

    return res.status(201).json({
      success: true,
      data: {
        orderId: result.order.id,
        status: result.order.status,
        totalAmount: result.totalAmount,
        items: result.items,
      },
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }
    console.log("checkout error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể xử lý đơn hàng. Vui lòng thử lại.",
    });
  }
};

const listOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const statusFilter = req.query.status;
    const where = {};
    if (statusFilter && ORDER_STATUSES.includes(statusFilter)) {
      where.status = statusFilter;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ["id", "username", "email", "fullName"] },
      ],
      order: [
        ["orderDate", "DESC"],
        ["id", "DESC"],
      ],
      limit,
      offset: (page - 1) * limit,
    });

    return res.json({
      success: true,
      data: orders.rows.map((order) =>
        formatOrderSummary(order.get({ plain: true }))
      ),
      pagination: {
        total: orders.count,
        page,
        totalPages: Math.ceil((orders.count || 0) / limit),
      },
    });
  } catch (error) {
    console.log("listOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách đơn hàng.",
    });
  }
};

const getOrderDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id, {
      include: [
        { model: User, attributes: ["id", "username", "email", "fullName"] },
        {
          model: OrderDetail,
          include: [
            {
              model: ProductSKU,
              include: [
                { model: Product, attributes: ["id", "name", "thumbnailUrl"] },
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
            },
          ],
        },
      ],
      order: [[OrderDetail, "id", "ASC"]],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    const plain = order.get({ plain: true });
    const details = (plain.OrderDetails || []).map((detail) => ({
      id: detail.id,
      productName: detail.productName,
      color: detail.color || detail.ProductSKU?.colorValue?.value || null,
      size: detail.size || detail.ProductSKU?.sizeValue?.value || null,
      quantity: detail.quantity,
      unitPrice: Number(detail.unitPrice) || 0,
      productImage:
        detail.ProductSKU?.Product?.thumbnailUrl ||
        detail.ProductSKU?.imageUrl ||
        null,
    }));

    return res.json({
      success: true,
      data: {
        ...formatOrderSummary(plain),
        shippingPhone: plain.shippingPhone,
        shippingAddress: plain.shippingAddress,
        note: plain.note,
        items: details,
      },
    });
  } catch (error) {
    console.log("getOrderDetail error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải chi tiết đơn hàng.",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Trạng thái đơn hàng không hợp lệ.",
    });
  }

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    const oldStatus = order.status;

    await sequelize.transaction(async (transaction) => {
      if (status === "Đã hủy" && order.status !== "Đã hủy") {
        await restockOrderItems(order.id, transaction);
      }
      await order.update({ status }, { transaction });
    });

    // Log order status update
    logUpdate(req, "orders", order.id, { status: oldStatus }, { status });

    return res.json({
      success: true,
      data: {
        id: order.id,
        status,
      },
      message: "Đã cập nhật trạng thái đơn hàng.",
    });
  } catch (error) {
    console.log("updateOrderStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái đơn hàng.",
    });
  }
};

export default {
  checkout,
  listOrders,
  getOrderDetail,
  updateOrderStatus,
};
