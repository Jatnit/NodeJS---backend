import bcrypt, { hash } from "bcryptjs";
import mysql from "mysql2";
//salt
const salt = bcrypt.genSaltSync(10);

// Create the connection to database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "jwt",
});

const hashUserPassWord = (userPassWord) => {
  const hashPassWord = bcrypt.hashSync(userPassWord, salt);
  return hashPassWord;
  //console.log("check: ", hashpassword);
  //let check = bcrypt.compareSync(password, hashpassword);
};

const CreateNewUser = (email, password, username) => {
  let hashPassWord = hashUserPassWord(password);
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

const getUserList = () => {
  const users = [];
  connection.query("select * from users", function (err, results, fields) {
    if (err) {
      console.log(err);
    }
    console.log("Check results :  ", results);
  });
};

module.exports = {
  CreateNewUser,
  getUserList,
};
