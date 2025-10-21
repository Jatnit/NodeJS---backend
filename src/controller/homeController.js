import userService from "../service/userService";

// Get the client

const handleHelloWorld = (req, res) => {
  return res.render("home.ejs");
};

const handleUserPage = (req, res) => {
  return res.render("user.ejs");
};

const handleCreateUser = (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let username = req.body.username;

  //userService.getUserList();
  userService.CreateNewUser(email, password, username);
  return res.send("handleCreateUser");
};

module.exports = {
  handleHelloWorld,
  handleUserPage,
  handleCreateUser,
};
