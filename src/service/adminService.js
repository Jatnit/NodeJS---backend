import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import bluebird from "bluebird";

const salt = bcrypt.genSaltSync(10);

const hashUserPassWord = (userPassWord) => {
  const hashPassWord = bcrypt.hashSync(userPassWord, salt);
  return hashPassWord;
};

const adminCreateUser = async (email, password, username, role = 2) => {
  const hashPassWord = hashUserPassWord(password);
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  try {
    const [rows, fields] = await connection.execute(
      "INSERT INTO users (email,password,username,role) VALUES (?,?,?,?)",
      [email, hashPassWord, username, role]
    );
    return rows;
  } catch (error) {
    console.log("adminCreateUser error:", error);
    throw error;
  }
};

const getUserList = async () => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  try {
    const [rows, fields] = await connection.execute("select * from users");
    return rows;
  } catch (error) {
    console.log("getUserList error :", error);
    throw error;
  }
};

const deleteUserById = async (id) => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  try {
    const [rows, fields] = await connection.execute(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    return rows;
  } catch (error) {
    console.log("deleteUserById error :", error);
    throw error;
  }
};

const updateUserById = async (id, email, username, role = 2) => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  try {
    const [rows, fields] = await connection.execute(
      "UPDATE users SET email = ?, username = ?, role = ? WHERE id = ?",
      [email, username, role, id]
    );
    return rows;
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
