import bcrypt from "bcryptjs";
import userService from "../service/userService";

// Get the client

const handleHelloWorld = (req, res) => {
  return res.render("home.ejs");
};

const handleUserPage = async (req, res) => {
  let userlist = await userService.getUserList();
  await userService.deleteUserById(9);
  console.log("Check user list:", userlist);
  return res.render("user.ejs", { userlist });
};

const handleCreateUser = async (req, res) => {
  const { email, password, username, source } = req.body;

  try {
    await userService.CreateNewUser(email, password, username);
    if (source === "signup") {
      return res.redirect("/signin?status=signup_success");
    }
    return res.redirect("/user");
  } catch (error) {
    console.log("handleCreateUser error:", error);
    if (source === "signup") {
      return res.status(400).render("signup.ejs", {
        errorMessage: "Không thể tạo tài khoản. Email có thể đã tồn tại.",
        successMessage: null,
        formData: { email, username },
      });
    }
    return res.redirect("/user");
  }
};

const handleDeleteUser = async (req, res) => {
  let id = req.params.id;
  if (id) {
    await userService.deleteUserById(id);
  }
  return res.redirect("/user");
};

const handleEditUser = async (req, res) => {
  const { id, email, username } = req.body;

  if (!id) {
    return res.redirect("/user");
  }

  try {
    await userService.updateUserById(id, email, username);
  } catch (error) {
    console.log("handleEditUser error:", error);
  }

  return res.redirect("/user");
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
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).render("signin.ejs", {
        errorMessage: "Email không tồn tại trong hệ thống.",
        successMessage: null,
        formData: { email },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render("signin.ejs", {
        errorMessage: "Mật khẩu không chính xác.",
        successMessage: null,
        formData: { email },
      });
    }

    return res.redirect("/user");
  } catch (error) {
    console.log("handleSignIn error:", error);
    return res.status(500).render("signin.ejs", {
      errorMessage: "Có lỗi xảy ra. Vui lòng thử lại.",
      successMessage: null,
      formData: { email },
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
};
