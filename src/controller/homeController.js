import bcrypt from "bcryptjs";
import userService from "../service/userService";
import adminService from "../service/adminService";

const isAuthenticated = (req) => req.session && req.session.user;
const isAdminSession = (req) =>
  isAuthenticated(req) && String(req.session.user.role_id) === "1";

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
      user.role_id === null || user.role_id === undefined
        ? "2"
        : String(user.role_id);

    req.session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role_id: normalizedRole,
    };

    if (!req.session.theme) {
      req.session.theme = "light";
    }

    if (normalizedRole === "1") {
      console.log("[SIGNIN] Admin login success:", email);
      return res.redirect("/admin/users");
    }
    if (normalizedRole === "2") {
      console.log("[SIGNIN] User login success:", email);
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
};
