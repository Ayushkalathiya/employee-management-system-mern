const express = require('express');
const app = express();
const pg = require("pg");
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
require('dotenv').config();
const { Workbook } = require('exceljs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require('pdfkit');
app.use(bodyParser.json()); // Add this line to parse JSON data


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("ejs", ejsMate);

const db = new pg.Client({
    user: "postgres",
    
    host: "localhost",
    database: process.env.DBNAME,
    password: process.env.DBPASS,
    port: 5432,
});

db.connect();

// Set view engine
app.set('view engine', 'ejs');

const employee = require("./routes/employee.js");
const admin = require("./routes/admin.js");
const login = require("./routes/login.js");
// for cookie
app.use(session({
    secret: "Its sgp",
    resave: false,
    saveUninitialized: true,
    cookie : {
        expires: Date.now() + 7 * 24   * 60 * 60 * 1000 ,// one week
        maxAge : 7 * 24   * 60 * 60 * 1000 ,
        httpOnly: true,
      },
}));

// flash
app.use(flash());

// save for flash into locals
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});


// login
app.use("/", login);

// for employee 
// we can make route of /emp

app.use("/emp", employee);

// for admin
// Admin route
app.use("/admin", admin);


// logout
app.get('/logout', (req, res) => {
    res.redirect("/")
});

// if page is not available
app.all("*", (req, res, next) => {
    console.log("into not found in index.js");
    next(new ExpressError(404, "Page Not Found"));
});


app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Somthing went wrong" } = err;
    res.status(statusCode).render("./pages/Error.ejs", { err });
});

app.listen(3000, () => {
    console.log(`port no : 3000`);
});
