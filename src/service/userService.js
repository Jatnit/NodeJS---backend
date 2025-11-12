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
  let hashPassWord = hashUserPassWord(password);
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  // A simple SELECT query
  connection.query(
    "insert into users (email,password,username) values (?,?,?)",
    [email, hashPassWord, username],
    function (err, results, fields) {
      if (err) {
        console.log(err);
      }
    }
  );
};

const getUserList = async () => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "jwt",
    Promise: bluebird,
  });
  let users = [];
  // return connection.query(
  //   "select * from users",
  //   function (err, results, fields) {
  //     if (err) {
  //       console.log(err);
  //       return users;
  //     }
  //     users = results;
  //     console.log("run get user list", users);
  //     return users;
  //   }
  // );
  try {
    const [rows, fields] = await connection.execute("select * from users");
    return rows;
  } catch (error) {
    console.log("check erro :", error);
  }
};
module.exports = {
  CreateNewUser,
  getUserList,
};
