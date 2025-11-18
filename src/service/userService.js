import bcrypt from "bcryptjs";
import User from "../models/User";

const salt = bcrypt.genSaltSync(10);

const hashUserPassWord = (userPassWord) => {
  const hashPassWord = bcrypt.hashSync(userPassWord, salt);
  return hashPassWord;
};

const registerUser = async (email, password, username, role = 2) => {
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
    console.log("registerUser error:", error);
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    const user = await User.findByPk(id, { raw: true });
    return user;
  } catch (error) {
    console.log("getUserById error:", error);
    throw error;
  }
};

const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({
      where: { email },
      raw: true,
    });
    return user;
  } catch (error) {
    console.log("getUserByEmail error:", error);
    throw error;
  }
};

module.exports = {
  registerUser,
  getUserByEmail,
  getUserById,
};
