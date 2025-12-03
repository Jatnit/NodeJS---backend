import Product from "../models/Product";
import ProductSKU from "../models/ProductSKU";
import ProductGallery from "../models/ProductGallery";
import ProductColorImage from "../models/ProductColorImage";
import AttributeValue from "../models/AttributeValue";
import Order from "../models/Order";
import OrderDetail from "../models/OrderDetail";
import UserAddress from "../models/UserAddress";
import Category from "../models/Category";
import User from "../models/User";
import { Op, fn, col, literal } from "sequelize";

import bcrypt from "bcryptjs";
import userService from "../service/userService";
import adminService from "../service/adminService";

const isAuthenticated = (req) => req.session && req.session.user;
const isAdminSession = (req) =>
  isAuthenticated(req) && String(req.session.user.roleId) === "1";

const formatFullAddress = (address) => {
  if (!address) return "";
  return [address.addressLine, address.ward, address.district, address.city]
    .filter((part) => part && String(part).trim() !== "")
    .join(", ");
};

const selectPreferredAddress = (addresses = []) => {
  if (!Array.isArray(addresses) || !addresses.length) return null;
  return (
    addresses.find((addr) => addr.isDefault) ||
    addresses.find((addr) => addr.isDefault === true) ||
    addresses[0]
  );
};

const ORDER_PROGRESS_STEPS = [
  { key: "Chờ xác nhận", label: "Chờ xác nhận" },
  { key: "Đang xử lý", label: "Đang xử lý" },
  { key: "Đang giao", label: "Đang giao" },
  { key: "Hoàn thành", label: "Hoàn thành" },
];

const getAddressesByUserId = async (userId) => {
  if (!userId) return [];
  return UserAddress.findAll({
    where: { userId },
    raw: true,
    order: [
      ["isDefault", "DESC"],
      ["id", "DESC"],
    ],
  });
};

const buildShippingPrefill = ({
  addresses = [],
  user = null,
  overrides = null,
}) => {
  if (overrides) {
    return {
      name:
        overrides.shippingName ||
        overrides.name ||
        overrides.recipientName ||
        "",
      phone: overrides.shippingPhone || overrides.phone || "",
      address: overrides.shippingAddress || overrides.address || "",
      note: overrides.note || "",
    };
  }

  const preferred = selectPreferredAddress(addresses);
  if (preferred) {
    return {
      name:
        preferred.recipientName ||
        user?.fullName ||
        user?.username ||
        user?.email ||
        "",
      phone: preferred.phoneNumber || "",
      address: formatFullAddress(preferred),
      note: "",
    };
  }

  return {
    name: (user && (user.fullName || user.username || user.email)) || "",
    phone: "",
    address: "",
    note: "",
  };
};

const getUserAddresses = async (req) => {
  if (!isAuthenticated(req)) {
    return [];
  }
  return getAddressesByUserId(req.session.user.id);
};

const buildQrPaymentConfig = (amount = 0, user = null) => {
  const bankCode = (process.env.QR_BANK_CODE || "VCB").toUpperCase();
  const accountNumber = process.env.QR_ACCOUNT_NUMBER || "0123456789";
  const accountName = process.env.QR_ACCOUNT_NAME || "MODA STUDIO";
  const template = process.env.QR_TEMPLATE || "compact2";
  const baseUrl = process.env.QR_IMAGE_BASE || "https://img.vietqr.io/image";
  const prefix = process.env.QR_TRANSFER_NOTE_PREFIX || "MODA";
  const userSegment = user?.id ? `-${user.id}` : "-GUEST";
  const timestampSegment = `-${Date.now().toString().slice(-6)}`;
  const transferNote =
    `${prefix}${userSegment}${timestampSegment}`.toUpperCase();
  const sanitizedAmount = Number(amount) || 0;
  const encodedNote = encodeURIComponent(transferNote);
  const encodedName = encodeURIComponent(accountName);
  const imageUrl = `${baseUrl}/${bankCode}-${accountNumber}-${template}.png?amount=${sanitizedAmount}&addInfo=${encodedNote}&accountName=${encodedName}`;

  return {
    bankCode,
    accountNumber,
    accountName,
    amount: sanitizedAmount,
    transferNote,
    imageUrl,
  };
};

const buildCheckoutViewModel = (req, cart, addresses, options = {}) => {
  const sanitizedCart = cart || { items: [], subtotal: 0 };
  return {
    cart: sanitizedCart,
    addresses,
    errorMessage: options.errorMessage || null,
    shippingPrefill: buildShippingPrefill({
      addresses,
      user: req.session.user,
      overrides: options.shippingOverrides,
    }),
    paymentPrefill: options.paymentMethod || "COD",
    qrPaymentConfig: buildQrPaymentConfig(
      sanitizedCart.subtotal,
      req.session.user
    ),
  };
};

const renderCheckoutWithError = async (
  req,
  res,
  { cart, message, overrides, paymentMethod = "COD", statusCode = 400 }
) => {
  const addresses = await getUserAddresses(req);
  const viewModel = buildCheckoutViewModel(req, cart, addresses, {
    shippingOverrides: overrides,
    paymentMethod,
    errorMessage: message,
  });
  return res.status(statusCode).render("checkout.ejs", viewModel);
};

const mapAddressesForProfile = (addresses = []) =>
  addresses.map((address) => ({
    id: address.id,
    recipientName: address.recipientName || "Chưa có tên",
    phoneNumber: address.phoneNumber || "Chưa cập nhật",
    fullAddress: formatFullAddress(address) || "Chưa có địa chỉ",
    isDefault: Boolean(address.isDefault),
  }));

const buildOrderProgress = (status) => {
  if (status === "Đã hủy") {
    return ORDER_PROGRESS_STEPS.map((step, idx) => ({
      ...step,
      isCompleted: false,
      isActive: idx === 0,
      isDisabled: true,
    }));
  }

  const stepIndex = ORDER_PROGRESS_STEPS.findIndex(
    (step) => step.key === status
  );
  const normalizedIndex = stepIndex >= 0 ? stepIndex : 0;

  return ORDER_PROGRESS_STEPS.map((step, idx) => ({
    ...step,
    isCompleted: idx <= normalizedIndex,
    isActive: idx === normalizedIndex,
    isDisabled: false,
  }));
};

const getOrdersForProfile = async (userId, limit = 6) => {
  if (!userId) return [];
  const rows = await Order.findAll({
    where: { userId },
    order: [
      ["orderDate", "DESC"],
      ["id", "DESC"],
    ],
    limit,
    raw: true,
  });

  return rows.map((order) => {
    const status = order.status || "Chờ xác nhận";
    return {
      id: order.id,
      code: `#${String(order.id).padStart(5, "0")}`,
      status,
      totalAmount: Number(order.totalAmount) || 0,
      paymentMethod: order.paymentMethod || "COD",
      orderDate: order.orderDate
        ? new Date(order.orderDate).toISOString()
        : null,
      progress: buildOrderProgress(status),
      isCancelled: status === "Đã hủy",
    };
  });
};

const toCurrencyNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapOrderDetailItems = (details = []) =>
  details.map((detail) => {
    const unitPrice = toCurrencyNumber(detail.unitPrice);
    const quantity = Number(detail.quantity) || 0;
    const variantLabel = [detail.color, detail.size]
      .filter((value) => value && value.trim() !== "")
      .join(" / ");
    return {
      id: detail.id,
      productSkuId: detail.productSkuId,
      name:
        detail.productName ||
        (detail.productSkuId ? `SKU #${detail.productSkuId}` : "Sản phẩm"),
      color: detail.color || null,
      size: detail.size || null,
      variantLabel: variantLabel || null,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });

const buildOrderBreakdown = (orderRecord, items) => {
  const itemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = toCurrencyNumber(orderRecord.shippingFee);
  const discount = toCurrencyNumber(orderRecord.discountAmount);
  const computedTotal = itemsTotal + shippingFee - discount;
  const grandTotal =
    toCurrencyNumber(orderRecord.totalAmount) || computedTotal || itemsTotal;
  return {
    itemsTotal,
    shippingFee,
    discount,
    grandTotal,
  };
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Hoàn thành":
      return "success";
    case "Đang giao":
      return "info";
    case "Đã hủy":
      return "danger";
    default:
      return "warning";
  }
};

const buildOrderDetailViewModel = (orderRecord, detailRecords) => {
  const items = mapOrderDetailItems(detailRecords);
  const breakdown = buildOrderBreakdown(orderRecord, items);
  const status = orderRecord.status || "Chờ xác nhận";
  return {
    orderSummary: {
      id: orderRecord.id,
      code: `#${String(orderRecord.id).padStart(5, "0")}`,
      status,
      statusBadge: getStatusBadgeClass(status),
      orderDate: orderRecord.orderDate
        ? new Date(orderRecord.orderDate).toISOString()
        : null,
      paymentMethod: orderRecord.paymentMethod || "COD",
      isPaid: Boolean(orderRecord.isPaid),
      note: orderRecord.note || "",
    },
    items,
    breakdown,
    shippingInfo: {
      name: orderRecord.shippingName || "Không xác định",
      phone: orderRecord.shippingPhone || "Chưa cập nhật",
      address:
        orderRecord.shippingAddress || "Địa chỉ giao hàng sẽ được bổ sung sau.",
    },
    timeline: buildOrderProgress(status),
    canCancel: status === "Chờ xác nhận",
  };
};

const getRevenueSeries = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - 11, 1);

  const rows = await Order.findAll({
    attributes: [
      [fn("DATE_FORMAT", col("OrderDate"), "%Y-%m"), "ym"],
      [fn("SUM", col("TotalAmount")), "total"],
    ],
    where: {
      orderDate: {
        [Op.gte]: start,
      },
    },
    group: ["ym"],
    order: [[literal("ym"), "ASC"]],
    raw: true,
  });

  const monthMap = new Map(rows.map((row) => [row.ym, Number(row.total) || 0]));

  const series = [];
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const ymKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    series.push({
      label: `T${date.getMonth() + 1}`,
      value: monthMap.get(ymKey) || 0,
    });
  }

  const revenueMax = Math.max(...series.map((item) => item.value), 1);
  return { series, revenueMax };
};

const getDashboardStats = async () => {
  const [totalRevenue, totalOrders, totalProducts, totalUsers] =
    await Promise.all([
      Order.sum("totalAmount"),
      Order.count(),
      Product.count({ where: { isActive: true } }),
      User.count(),
    ]);

  return [
    {
      id: "revenue",
      label: "Tổng doanh thu",
      value: Number(totalRevenue) || 0,
      growth: "Dữ liệu thực",
    },
    {
      id: "orders",
      label: "Tổng đơn hàng",
      value: totalOrders || 0,
      growth: "Dữ liệu thực",
    },
    {
      id: "products",
      label: "Tổng sản phẩm",
      value: totalProducts || 0,
      growth: "Active",
    },
    {
      id: "users",
      label: "Tổng người dùng",
      value: totalUsers || 0,
      growth: "Dữ liệu thực",
    },
  ];
};

const getRecentOrders = async () => {
  const orders = await Order.findAll({
    attributes: ["id", "shippingName", "orderDate", "totalAmount", "status"],
    order: [["orderDate", "DESC"]],
    limit: 5,
    raw: true,
  });

  return orders.map((order) => ({
    id: `#${order.id}`,
    customer: order.shippingName || "Khách lẻ",
    date: order.orderDate || new Date(),
    total: Number(order.totalAmount) || 0,
    status: order.status || "Chờ xác nhận",
  }));
};

const getOrderStatusBreakdown = async () => {
  const rows = await Order.findAll({
    attributes: ["status", [fn("COUNT", col("status")), "count"]],
    group: ["status"],
    raw: true,
  });

  const map = {
    "Chờ xác nhận": 0,
    "Đang xử lý": 0,
    "Đang giao": 0,
    "Hoàn thành": 0,
    "Đã hủy": 0,
  };

  rows.forEach((row) => {
    map[row.status] = Number(row.count) || 0;
  });

  return map;
};

const getAdminDashboardData = async () => {
  const [stats, revenue, recentOrders, statusBreakdown] = await Promise.all([
    getDashboardStats(),
    getRevenueSeries(),
    getRecentOrders(),
    getOrderStatusBreakdown(),
  ]);

  return {
    stats,
    revenueSeries: revenue.series,
    revenueMax: revenue.revenueMax,
    recentOrders,
    statusBreakdown,
  };
};

// Get the client

const handleHelloWorld = (req, res) => {
  return res.render("home.ejs");
};

const handleUserPage = async (req, res) => {
  if (!isAdminSession(req)) {
    return res.redirect("/signin");
  }
  let userlist = await adminService.getUserList();
  console.log("Check user list:", userlist);
  return res.render("admin/user.ejs", { userlist });
};

const handleCreateUser = async (req, res) => {
  const { email, password, username, source, role } = req.body;

  try {
    if (source === "signup") {
      await userService.registerUser(email, password, username, 2);
      return res.redirect("/signin?status=signup_success");
    }

    if (!isAdminSession(req)) {
      return res.redirect("/signin");
    }

    const normalizedRole = role && role !== "" ? role : "2";
    await adminService.adminCreateUser(
      email,
      password,
      username,
      normalizedRole
    );
    return res.redirect("/admin/users");
  } catch (error) {
    console.log("handleCreateUser error:", error);
    if (source === "signup") {
      return res.status(400).render("signup.ejs", {
        errorMessage: "Không thể tạo tài khoản. Email có thể đã tồn tại.",
        successMessage: null,
        formData: { email, username },
      });
    }
    return res.redirect("/admin/users");
  }
};

const handleDeleteUser = async (req, res) => {
  if (!isAdminSession(req)) {
    return res.redirect("/signin");
  }
  let id = req.params.id;
  if (id) {
    await adminService.deleteUserById(id);
  }
  return res.redirect("/admin/users");
};

const handleEditUser = async (req, res) => {
  if (!isAdminSession(req)) {
    return res.redirect("/signin");
  }
  const { id, email, username, role } = req.body;

  if (!id) {
    return res.redirect("/admin/users");
  }

  try {
    const normalizedRole = role && role !== "" ? role : "2";
    await adminService.updateUserById(id, email, username, normalizedRole);
  } catch (error) {
    console.log("handleEditUser error:", error);
  }

  return res.redirect("/admin/users");
};

const renderSignIn = (req, res) => {
  const { status } = req.query;
  let successMessage = null;
  if (status === "signup_success") {
    successMessage = "Tạo tài khoản thành công. Vui lòng đăng nhập.";
  }
  return res.render("signin.ejs", {
    errorMessage: null,
    successMessage,
    formData: { email: "" },
  });
};

const renderSignUp = (req, res) => {
  return res.render("signup.ejs", {
    errorMessage: null,
    successMessage: null,
    formData: { email: "", username: "" },
  });
};

const handleSignIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("[SIGNIN] Incoming login attempt:", email);
    const user = await userService.getUserByEmail(email);
    if (!user) {
      console.warn("[SIGNIN] Email not found:", email);
      return res.status(401).render("signin.ejs", {
        errorMessage: "Email không tồn tại trong hệ thống.",
        successMessage: null,
        formData: { email },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("[SIGNIN] Wrong password for email:", email);
      return res.status(401).render("signin.ejs", {
        errorMessage: "Mật khẩu không chính xác.",
        successMessage: null,
        formData: { email },
      });
    }

    const normalizedRole =
      user.roleId === null || user.roleId === undefined
        ? "2"
        : String(user.roleId);

    req.session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      roleId: normalizedRole,
    };

    if (!req.session.theme) {
      req.session.theme = "light";
    }

    if (normalizedRole === "1") {
      console.log("[SIGNIN] Admin login success:", email, "(role: Admin)");
      return res.redirect("/admin/dashboard");
    }
    if (normalizedRole === "2") {
      console.log("[SIGNIN] User login success:", email, "(role: Customer)");
      return res.redirect(`/user/profile/${user.id}`);
    }
    console.warn(
      "[SIGNIN] Unknown role, fallback to profile:",
      email,
      normalizedRole
    );
    return res.redirect(`/user/profile/${user.id}`);
  } catch (error) {
    console.error("[SIGNIN] Unexpected error for email:", email, error);
    return res.status(500).render("signin.ejs", {
      errorMessage: "Có lỗi xảy ra. Vui lòng thử lại.",
      successMessage: null,
      formData: { email },
    });
  }
};

const handleUserProfile = async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect("/signin");
  }
  const { id } = req.params;
  const requester = req.session.user;
  const isOwner = Number(id) === Number(requester.id);
  if (!isOwner && !isAdminSession(req)) {
    return res.redirect(`/user/profile/${requester.id}`);
  }
  try {
    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).render("user-profile.ejs", {
        user: null,
        addresses: [],
        orders: [],
        errorMessage: "Không tìm thấy thông tin người dùng.",
      });
    }
    const [addresses, orders] = await Promise.all([
      getAddressesByUserId(id).then((list) => mapAddressesForProfile(list)),
      getOrdersForProfile(id),
    ]);
    return res.render("user-profile.ejs", {
      user,
      addresses,
      orders,
      errorMessage: null,
    });
  } catch (error) {
    console.log("handleUserProfile error:", error);
    return res.status(500).render("user-profile.ejs", {
      user: null,
      addresses: [],
      orders: [],
      errorMessage: "Có lỗi xảy ra. Vui lòng thử lại.",
    });
  }
};

const renderOrderDetailPage = async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect("/signin");
  }
  const { orderId } = req.params;
  const parsedId = Number(orderId);
  if (!Number.isFinite(parsedId)) {
    return res.redirect(`/user/profile/${req.session.user.id}`);
  }

  const statusFlag = req.query.status;
  const successMessage =
    statusFlag === "cancel_success"
      ? "Yêu cầu hủy đơn đã được ghi nhận thành công."
      : null;
  const warningMessage =
    statusFlag === "cancel_error"
      ? "Không thể hủy đơn hàng này. Vui lòng thử lại."
      : null;

  try {
    const orderRecord = await Order.findOne({
      where: { id: parsedId },
      raw: true,
    });
    const hasAccess =
      orderRecord &&
      (isAdminSession(req) ||
        Number(orderRecord.userId) === Number(req.session.user.id));

    if (!hasAccess) {
      return res.status(404).render("order-detail.ejs", {
        orderSummary: null,
        items: [],
        breakdown: null,
        shippingInfo: null,
        timeline: [],
        canCancel: false,
        cancelAction: null,
        successMessage: null,
        errorMessage:
          "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.",
        currentUser: req.session.user,
      });
    }

    const detailRecords = await OrderDetail.findAll({
      where: { orderId: parsedId },
      raw: true,
      order: [["id", "ASC"]],
    });

    const viewModel = buildOrderDetailViewModel(orderRecord, detailRecords);
    return res.render("order-detail.ejs", {
      ...viewModel,
      cancelAction: `/user/orders/${orderRecord.id}/cancel`,
      successMessage,
      errorMessage: warningMessage,
      currentUser: req.session.user,
    });
  } catch (error) {
    console.log("renderOrderDetailPage error:", error);
    return res.status(500).render("order-detail.ejs", {
      orderSummary: null,
      items: [],
      breakdown: null,
      shippingInfo: null,
      timeline: [],
      canCancel: false,
      cancelAction: null,
      successMessage: null,
      errorMessage: "Không thể tải chi tiết đơn hàng. Vui lòng thử lại.",
      currentUser: req.session.user,
    });
  }
};

const handleOrderCancellation = async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect("/signin");
  }
  const { orderId } = req.params;
  const parsedId = Number(orderId);
  if (!Number.isFinite(parsedId)) {
    return res.redirect(`/user/profile/${req.session.user.id}`);
  }

  try {
    const orderRecord = await Order.findOne({
      where: { id: parsedId },
      raw: true,
    });
    const hasAccess =
      orderRecord &&
      (isAdminSession(req) ||
        Number(orderRecord.userId) === Number(req.session.user.id));

    if (!hasAccess || orderRecord.status !== "Chờ xác nhận") {
      return res.redirect(`/user/orders/${orderId}?status=cancel_error`);
    }

    await Order.update(
      { status: "Đã hủy" },
      {
        where: { id: parsedId },
      }
    );

    return res.redirect(`/user/orders/${orderId}?status=cancel_success`);
  } catch (error) {
    console.log("handleOrderCancellation error:", error);
    return res.redirect(`/user/orders/${orderId}?status=cancel_error`);
  }
};

const handleLogout = (req, res) => {
  req.session.user = null;
  req.session.theme = null;
  req.session.destroy((err) => {
    if (err) {
      console.log("handleLogout error:", err);
    }
    res.clearCookie("connect.sid");
    return res.redirect("/");
  });
};

const handleThemeChange = (req, res) => {
  if (!isAuthenticated(req)) {
    return res.redirect("/signin");
  }
  const { theme } = req.body;
  const nextTheme = theme === "dark" ? "dark" : "light";
  req.session.theme = nextTheme;
  const redirectTo = req.get("Referer") || "/";
  return res.redirect(redirectTo);
};

const handleProductListing = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ["id", "name", "slug"],
      order: [
        ["parentId", "ASC"],
        ["name", "ASC"],
      ],
      raw: true,
    });

    return res.render("products.ejs", {
      categories,
      errorMessage: null,
    });
  } catch (error) {
    console.log("handleProductListing error:", error);
    return res.render("products.ejs", {
      categories: [],
      errorMessage: "Không thể tải danh sách danh mục.",
    });
  }
};

const handleProductDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const productRecord = await Product.findOne({
      where: { id, isActive: true },
      include: [
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
          order: [
            ["colorValueId", "ASC"],
            ["sizeValueId", "ASC"],
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
      ],
    });

    if (!productRecord) {
      return res.status(404).render("product-detail.ejs", {
        product: null,
        galleries: [],
        colorImages: [],
        colorOptions: [],
        sizeOptions: [],
        skuOptions: [],
        errorMessage: "Không tìm thấy sản phẩm.",
      });
    }

    const product = productRecord.get({ plain: true });
    const galleries = (product.ProductGalleries || [])
      .slice()
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((item) => item.imageUrl)
      .filter(Boolean);
    if (!galleries.length && product.thumbnailUrl) {
      galleries.push(product.thumbnailUrl);
    }

    const colorImages = (product.ProductColorImages || []).map((item) => ({
      colorValueId: item.colorValueId,
      imageUrl: item.imageUrl,
      label: item.colorValue?.value || "",
      code: item.colorValue?.code || null,
    }));

    const skuOptions = (product.ProductSKUs || []).map((sku) => ({
      id: sku.id,
      skuCode: sku.skuCode,
      price: Number(sku.price),
      stockQuantity: Number(sku.stockQuantity) || 0,
      colorValueId: sku.colorValueId,
      sizeValueId: sku.sizeValueId,
      colorLabel: sku.colorValue?.value || "",
      colorCode: sku.colorValue?.code || null,
      sizeLabel: sku.sizeValue?.value || "",
    }));

    const colorMap = new Map();
    const sizeMap = new Map();
    skuOptions.forEach((sku) => {
      if (sku.colorValueId && !colorMap.has(sku.colorValueId)) {
        colorMap.set(sku.colorValueId, {
          id: sku.colorValueId,
          value: sku.colorLabel,
          code: sku.colorCode,
        });
      }
      if (sku.sizeValueId && !sizeMap.has(sku.sizeValueId)) {
        sizeMap.set(sku.sizeValueId, {
          id: sku.sizeValueId,
          value: sku.sizeLabel,
        });
      }
    });

    return res.render("product-detail.ejs", {
      product,
      galleries,
      colorImages,
      colorOptions: Array.from(colorMap.values()),
      sizeOptions: Array.from(sizeMap.values()),
      skuOptions,
      errorMessage: null,
    });
  } catch (error) {
    console.log("handleProductDetail error:", error);
    return res.status(500).render("product-detail.ejs", {
      product: null,
      galleries: [],
      colorImages: [],
      colorOptions: [],
      sizeOptions: [],
      skuOptions: [],
      errorMessage: "Có lỗi xảy ra khi tải sản phẩm.",
    });
  }
};

const handleAddToCart = async (req, res) => {
  const { skuId, quantity } = req.body;

  if (!skuId) {
    return res
      .status(400)
      .json({ success: false, message: "Please select options" });
  }

  try {
    const sku = await ProductSKU.findOne({
      where: { id: skuId },
      include: [
        {
          model: Product,
          attributes: ["id", "name", "thumbnailUrl"],
        },
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
    });

    if (!sku) {
      return res
        .status(404)
        .json({ success: false, message: "SKU not found." });
    }

    const selectedQuantity = Number(quantity) > 0 ? Number(quantity) : 1;
    const colorLabel = sku.colorValue?.value || "Không rõ màu";
    const sizeLabel = sku.sizeValue?.value || "Không rõ size";
    const variantLabel = `${colorLabel} / ${sizeLabel}`;

    const cartItem = {
      skuId: sku.id,
      productId: sku.Product.id,
      name: sku.Product.name,
      thumbnailUrl: sku.Product.thumbnailUrl,
      price: Number(sku.price),
      quantity: selectedQuantity,
      variantLabel,
      stockQuantity: sku.stockQuantity,
      colorLabel,
      sizeLabel,
    };

    if (!req.session.cart) {
      req.session.cart = { items: [], subtotal: 0 };
    }

    const existing = req.session.cart.items.find(
      (item) => item.skuId === cartItem.skuId
    );
    if (existing) {
      existing.quantity += selectedQuantity;
    } else {
      req.session.cart.items.push(cartItem);
    }

    req.session.cart.subtotal = req.session.cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return res.json({
      success: true,
      cart: req.session.cart,
    });
  } catch (error) {
    console.log("handleAddToCart error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to add to cart." });
  }
};

const renderCheckoutPage = async (req, res) => {
  const cart = req.session.cart || { items: [], subtotal: 0 };
  if (!cart.items.length) {
    return res.redirect("/products");
  }

  const addresses = await getUserAddresses(req);
  const viewModel = buildCheckoutViewModel(req, cart, addresses, {
    paymentMethod: "COD",
  });

  return res.render("checkout.ejs", viewModel);
};

const handleCheckout = async (req, res) => {
  const cart = req.session.cart;
  const {
    shippingName,
    shippingPhone,
    shippingAddress,
    paymentMethod = "COD",
  } = req.body;

  const normalizedPaymentMethod =
    typeof paymentMethod === "string" &&
    paymentMethod.toLowerCase() === "banking"
      ? "Banking"
      : "COD";

  if (!cart || !cart.items.length) {
    return renderCheckoutWithError(req, res, {
      cart: cart || { items: [], subtotal: 0 },
      message: "Giỏ hàng đang trống.",
      overrides: req.body,
      paymentMethod: normalizedPaymentMethod,
    });
  }

  if (!shippingName || !shippingPhone || !shippingAddress) {
    return renderCheckoutWithError(req, res, {
      cart,
      message: "Vui lòng nhập đầy đủ thông tin giao hàng.",
      overrides: req.body,
      paymentMethod: normalizedPaymentMethod,
    });
  }

  try {
    const order = await Order.create({
      userId: isAuthenticated(req) ? req.session.user.id : null,
      totalAmount: cart.subtotal,
      status: "Chờ xác nhận",
      paymentMethod: normalizedPaymentMethod,
      isPaid: normalizedPaymentMethod !== "COD",
      shippingName,
      shippingPhone,
      shippingAddress,
      note: req.body.note || null,
    });

    const detailPayload = cart.items.map((item) => ({
      orderId: order.id,
      productSkuId: item.skuId,
      productName: item.name,
      color: item.colorLabel || null,
      size: item.sizeLabel || null,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    await OrderDetail.bulkCreate(detailPayload);

    req.session.cart = { items: [], subtotal: 0 };

    return res.render("checkout-success.ejs", { order });
  } catch (error) {
    console.log("handleCheckout error:", error);
    return renderCheckoutWithError(req, res, {
      cart,
      message: "Đặt hàng thất bại. Vui lòng thử lại.",
      overrides: req.body,
      paymentMethod: normalizedPaymentMethod,
      statusCode: 500,
    });
  }
};

module.exports = {
  handleHelloWorld,
  handleUserPage,
  handleCreateUser,
  handleDeleteUser,
  handleEditUser,
  renderSignIn,
  renderSignUp,
  handleSignIn,
  handleUserProfile,
  handleLogout,
  handleThemeChange,
  handleProductListing,
  handleProductDetail,
  handleAddToCart,
  renderCheckoutPage,
  handleCheckout,
  renderOrderDetailPage,
  handleOrderCancellation,
  renderAdminDashboard: async (req, res) => {
    if (!isAdminSession(req)) {
      return res.redirect("/signin");
    }
    try {
      const theme =
        (req.session && req.session.theme) ||
        (req.cookies && req.cookies.theme);
      return res.render("admin/dashboard.ejs", {
        currentUser: req.session.user,
        theme: theme || "light",
      });
    } catch (error) {
      console.log("renderAdminDashboard error:", error);
      return res.render("admin/dashboard.ejs", {
        currentUser: req.session.user,
        theme: "light",
        errorMessage: "Không thể tải dữ liệu dashboard.",
      });
    }
  },
};
