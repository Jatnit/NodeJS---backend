import { Op, fn, col, literal } from "sequelize";
import { Order, Product, User } from "../models";

const buildDateKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const formatLabel = (date) =>
  new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

const getRecentRevenue = async () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 6);

  const revenueRows = await Order.findAll({
    attributes: [
      [fn("DATE", col("OrderDate")), "orderDate"],
      [fn("SUM", col("TotalAmount")), "total"],
    ],
    where: {
      orderDate: { [Op.gte]: startDate },
      status: "Hoàn thành",
    },
    group: [literal("DATE(OrderDate)")],
    order: [[literal("DATE(OrderDate)"), "ASC"]],
    raw: true,
  });

  const revenueMap = new Map(
    revenueRows.map((row) => [buildDateKey(row.orderDate), Number(row.total) || 0])
  );

  const series = [];
  for (let i = 0; i < 7; i += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const key = buildDateKey(current);
    series.push({
      date: key,
      label: formatLabel(current),
      total: revenueMap.get(key) || 0,
    });
  }

  return series;
};

const getSummary = async (_req, res) => {
  try {
    const [totalRevenueRaw, totalOrders, totalProducts, recentRevenue] =
      await Promise.all([
        Order.sum("totalAmount", { where: { status: "Hoàn thành" } }),
        Order.count(),
        Product.count(),
        getRecentRevenue(),
      ]);

    return res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenueRaw) || 0,
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        recentRevenue,
      },
    });
  } catch (error) {
    console.log("Dashboard getSummary error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải dữ liệu tổng quan.",
      error: error.message,
    });
  }
};

const getRecentOrders = async (_req, res) => {
  try {
    const orders = await Order.findAll({
      attributes: ["id", "orderDate", "totalAmount", "status", "shippingName"],
      include: [
        {
          model: User,
          attributes: ["id", "username", "fullName", "email"],
        },
      ],
      order: [["orderDate", "DESC"]],
      limit: 8,
      raw: true,
      nest: true,
    });

    const formatted = orders.map((order) => {
      const customerName =
        order.shippingName ||
        order.User?.fullName ||
        order.User?.username ||
        order.User?.email ||
        "Khách lẻ";

      const orderDate = order.orderDate
        ? new Date(order.orderDate)
        : new Date();

      return {
        id: order.id,
        code: `#${order.id}`,
        customerName,
        orderDate: orderDate.toISOString(),
        totalAmount: Number(order.totalAmount) || 0,
        status: order.status || "Mới",
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.log("Dashboard getRecentOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải đơn hàng gần đây.",
      error: error.message,
    });
  }
};

export default {
  getSummary,
  getRecentOrders,
};
