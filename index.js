const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const methodOverride = require("method-override");
const HandyStorage = require('handy-storage');

const store = new HandyStorage('./store.json');

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "storeManagemntDB",
});

const app = express();

app.set("view engine", "ejs");
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    key: "This is the session key",
    secret: "This is just s a demo",
    cookie: { maxAge: oneDay },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
store.set("userID", -1)


app.get("/", (req, res) => {
    if (!req.session.loggedin && !store.get("userID") != -1) res.redirect("/login");
    else {
      let id = store.get("userID");
      db.query(
        "SELECT isadmin FROM accounts WHERE id = ?",
        [id],
        (err, result) => {
          if (result.length > 0) {
            console.log(result);
            if (result[0].isadmin == 1) {
              res.render("home", { isadmin: true });
            } else res.render("home", { isadmin: false });
          }
        }
      );
    }
  });

app.get("/login", (req, res) => {
    if (req.session.loggedin || store.get("userID") != -1) res.redirect("/");
    else res.render("login", { error: null });
  });
  
  app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log(username, password);
    if (username && password) {
      db.query(
        "SELECT * FROM accounts WHERE username = ? AND password = ?",
        [username, password],
        (err, result, fields) => {
          if (result.length > 0) {
            console.log(result);
            req.session.loggedin = true;
            req.session.userId = result[0].id;
            req.session.username = username;
            store.set("userID", result[0].id);
            if (result[0].isadmin == 1) store.set("isadmin", true);
            else store.set("isadmin", false);
            res.redirect("/");
          } else {
            res.render("login", { error: "Incorrect Username and/or Password!" });
          }
        }
      );
    }
  });
  
  app.get("/register", (req, res) => {
    // console.log(store.get('userID'))
    if (req.session.loggedin || store.get("userID") != -1) res.redirect("/");
    else res.render("register", { error: null });
  });
  
  app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username && password) {
      db.query(
        "INSERT INTO accounts values (null, ?, ?, false)",
        [username, password],
        (err, results, fields) => {
          if (err) res.render("register", { error: "Registration Failed" });
          else res.redirect("/login");
        }
      );
    }
  });

  app.get("/logout", (req, res) => {
    store.set("userID", 0)
    // 	if(store.get("userID") == null)
    // 		res.redirect("/")
    // 	else
    res.redirect("/login")
     })

  app.listen(3000);