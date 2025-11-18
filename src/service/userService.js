import bcrypt, { hash } from "bcryptjs";
import mysql from "mysql2/promise";
import bluebird from "bluebird";

// create the connection, specify bluebird as Promise

//salt
const salt = bcrypt.genSaltSync(10);

const hashUserPassWord = (userPassWord) => {
  const hashPassWord = bcrypt.hashSync(userPassWord, salt);
  return hashPassWord;
  //console.log("check: ", hashpassword);
  //let check = bcrypt.compareSync(password, hashpassword);
};

const CreateNewUser = async (email, password, username) => {
  const hashPassWord = hashUserPassWord(password);
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  try {
    const [rows, fields] = await connection.execute(
      "INSERT INTO users (email,password,username) VALUES (?,?,?)",
      [email, hashPassWord, username]
    );
    return rows;
  } catch (error) {
    console.log("CreateNewUser error:", error);
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
    console.log("check erro :", error);
  }
};

const deleteUserById = async (id) => {
  // DELETE FROM `users` WHERE `users`.`id` = [id]
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
    console.log("check erro :", error);
  }
};

const updateUserById = async (id, email, username) => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  try {
    const [rows, fields] = await connection.execute(
      "UPDATE users SET email = ?, username = ? WHERE id = ?",
      [email, username, id]
    );
    return rows;
  } catch (error) {
    console.log("check erro :", error);
  }
};

const getUserByEmail = async (email) => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  try {
    const [rows, fields] = await connection.execute(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
    return null;
  } catch (error) {
    console.log("getUserByEmail error:", error);
    throw error;
  }
};

module.exports = {
  CreateNewUser,
  getUserList,
  deleteUserById,
  updateUserById,
  getUserByEmail,
};
