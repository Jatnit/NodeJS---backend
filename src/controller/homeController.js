import Product from "../models/Product";
import ProductSKU from "../models/ProductSKU";
import Attribute from "../models/Attribute";
import AttributeValue from "../models/AttributeValue";
import Order from "../models/Order";
import OrderDetail from "../models/OrderDetail";
import UserAddress from "../models/UserAddress";
import Category from "../models/Category";

import bcrypt from "bcryptjs";
import userService from "../service/userService";
import adminService from "../service/adminService";

const isAuthenticated = (req) => req.session && req.session.user;
const isAdminSession = (req) =>
  isAuthenticated(req) && String(req.session.user.roleId) === "1";

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
  return res.render("user.ejs", { userlist });
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
      return res.redirect("/admin/users");
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
        errorMessage: "Không tìm thấy thông tin người dùng.",
      });
    }
    return res.render("user-profile.ejs", {
      user,
      errorMessage: null,
    });
  } catch (error) {
    console.log("handleUserProfile error:", error);
    return res.status(500).render("user-profile.ejs", {
      user: null,
      errorMessage: "Có lỗi xảy ra. Vui lòng thử lại.",
    });
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
    const product = await Product.findOne({
      where: { id, isActive: true },
      raw: true,
    });

    if (!product) {
      return res.status(404).render("product-detail.ejs", {
        product: null,
        attributeGroups: [],
        skus: [],
        errorMessage: "Không tìm thấy sản phẩm.",
      });
    }

    const skuRecords = await ProductSKU.findAll({
      where: { productId: id },
      include: [
        {
          model: AttributeValue,
          attributes: ["id", "value", "attributeId"],
          include: [{ model: Attribute, attributes: ["id", "name"] }],
          through: { attributes: [] },
        },
      ],
      order: [["id", "ASC"]],
    });

    const plainSkus = skuRecords.map((sku) => sku.get({ plain: true }));

    const attributeGroupsMap = {};
    plainSkus.forEach((sku) => {
      (sku.AttributeValues || []).forEach((attrValue) => {
        const attr = attrValue.Attribute;
        if (!attr) return;
        if (!attributeGroupsMap[attr.id]) {
          attributeGroupsMap[attr.id] = {
            attributeId: attr.id,
            attributeName: attr.name,
            values: {},
          };
        }
        attributeGroupsMap[attr.id].values[attrValue.id] = attrValue.value;
      });
    });

    const attributeGroups = Object.values(attributeGroupsMap)
      .map((group) => ({
        attributeId: group.attributeId,
        attributeName: group.attributeName,
        values: Object.entries(group.values).map(([valueId, value]) => ({
          id: Number(valueId),
          value,
        })),
      }))
      .sort((a, b) => a.attributeName.localeCompare(b.attributeName));

    const skuOptions = plainSkus.map((sku) => ({
      id: sku.id,
      price: Number(sku.price),
      stockQuantity: sku.stockQuantity,
      imageUrl: sku.imageUrl || product.thumbnailUrl,
      attributeValueIds: (sku.AttributeValues || []).map(
        (attrValue) => attrValue.id
      ),
    }));

    return res.render("product-detail.ejs", {
      product,
      attributeGroups,
      skuOptions,
      errorMessage: null,
    });
  } catch (error) {
    console.log("handleProductDetail error:", error);
    return res.status(500).render("product-detail.ejs", {
      product: null,
      attributeGroups: [],
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
          attributes: ["id", "value"],
          include: [{ model: Attribute, attributes: ["id", "name"] }],
          through: { attributes: [] },
        },
      ],
    });

    if (!sku) {
      return res
        .status(404)
        .json({ success: false, message: "SKU not found." });
    }

    const selectedQuantity = Number(quantity) > 0 ? Number(quantity) : 1;
    const variantLabel = (sku.AttributeValues || [])
      .map((av) => {
        const attrName = av.Attribute ? av.Attribute.name : "";
        return attrName ? `${attrName}: ${av.value}` : av.value;
      })
      .join(" / ");

    const cartItem = {
      skuId: sku.id,
      productId: sku.Product.id,
      name: sku.Product.name,
      thumbnailUrl: sku.imageUrl || sku.Product.thumbnailUrl,
      price: Number(sku.price),
      quantity: selectedQuantity,
      variantLabel,
      stockQuantity: sku.stockQuantity,
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

  let addresses = [];
  if (isAuthenticated(req)) {
    addresses = await UserAddress.findAll({
      where: { userId: req.session.user.id },
      raw: true,
      order: [["isDefault", "DESC"]],
    });
  }

  return res.render("checkout.ejs", {
    cart,
    addresses,
    errorMessage: null,
  });
};

const handleCheckout = async (req, res) => {
  const cart = req.session.cart;
  if (!cart || !cart.items.length) {
    return res.status(400).render("checkout.ejs", {
      cart: { items: [], subtotal: 0 },
      addresses: [],
      errorMessage: "Giỏ hàng đang trống.",
    });
  }

  const {
    shippingName,
    shippingPhone,
    shippingAddress,
    paymentMethod = "COD",
  } = req.body;

  if (!shippingName || !shippingPhone || !shippingAddress) {
    return res.status(400).render("checkout.ejs", {
      cart,
      addresses: [],
      errorMessage: "Vui lòng nhập đầy đủ thông tin giao hàng.",
    });
  }

  try {
    const order = await Order.create({
      userId: isAuthenticated(req) ? req.session.user.id : null,
      totalAmount: cart.subtotal,
      status: "Chờ xác nhận",
      paymentMethod,
      isPaid: paymentMethod !== "COD",
      shippingName,
      shippingPhone,
      shippingAddress,
      note: req.body.note || null,
    });

    const detailPayload = cart.items.map((item) => ({
      orderId: order.id,
      productSkuId: item.skuId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    await OrderDetail.bulkCreate(detailPayload);

    req.session.cart = { items: [], subtotal: 0 };

    return res.render("checkout-success.ejs", { order });
  } catch (error) {
    console.log("handleCheckout error:", error);
    return res.status(500).render("checkout.ejs", {
      cart,
      addresses: [],
      errorMessage: "Đặt hàng thất bại. Vui lòng thử lại.",
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
};
