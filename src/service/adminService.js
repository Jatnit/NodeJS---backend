import bcrypt from "bcryptjs";
import User from "../models/User";

const salt = bcrypt.genSaltSync(10);

const hashUserPassWord = (userPassWord) => {
  const hashPassWord = bcrypt.hashSync(userPassWord, salt);
  return hashPassWord;
};

const adminCreateUser = async (email, password, username, role = 2) => {
  try {
    const hashPassWord = hashUserPassWord(password);
    const normalizedRole = Number(role) || 2;
    const user = await User.create({
      email,
      password: hashPassWord,
      username,
      role_id: normalizedRole,
    });
    return user.get({ plain: true });
  } catch (error) {
    console.log("adminCreateUser error:", error);
    throw error;
  }
};

const getUserList = async () => {
  try {
    return await User.findAll({
      order: [["id", "ASC"]],
      raw: true,
    });
  } catch (error) {
    console.log("getUserList error :", error);
    throw error;
  }
};

const deleteUserById = async (id) => {
  try {
    return await User.destroy({
      where: { id },
    });
  } catch (error) {
    console.log("deleteUserById error :", error);
    throw error;
  }
};

const updateUserById = async (id, email, username, role = 2) => {
  try {
    const normalizedRole = Number(role) || 2;
    const [updatedRows] = await User.update(
      { email, username, role_id: normalizedRole },
      { where: { id } }
    );
    return updatedRows;
  } catch (error) {
    console.log("updateUserById error :", error);
    throw error;
  }
};

module.exports = {
  adminCreateUser,
  getUserList,
  deleteUserById,
  updateUserById,
};
