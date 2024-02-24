const express =  require('express');
const bodyParser =  require('body-parser');
// const pg = require("pg");
// const nodemailer = require("nodemailer");
// const bcrypt =  require("bcrypt");
// const jwt = require('jsonwebtoken');
// const { Workbook } = require('exceljs');
// require('dotenv').config();
// const ExpressError = require('./utils/ExpressError.js');
const router = express.Router();
const app = express();
// const wrapAsync = require('../utils/wrapAsync.js');

const loginContoller = require("../controllers/login.js");
// app.use(bodyParser.urlencoded({extended: true}));

// const db = new pg.Client({
//     user:"postgres",
//     host:"localhost",
//     database:process.env.DBNAME,
//     password:process.env.DBPASS,
//     port:5432,
// });
// db.connect();



router.get(
    "/", 
    (loginContoller.renderLogin)
);

router.get(
    "/forgot", 
    (loginContoller.renderForgotpass)
);

router.post(
    "/forgot", 
    (loginContoller.forgotpass)
);

router.get(
    "/reset-password/:token", 
    (loginContoller.resetPasswordToken)
);


router.get("/final", (req, res) => {
    //For normal User
    res.render("./pages/final.ejs");
});

router.get("/NewEmp", (req, res) => {
    res.render("./pages/NewEmp.ejs");
});

router.post(
    "/register", 
    (loginContoller.register)
);



router.post(
    "/verify", 
    (loginContoller.verify)
);

router.post(
    "/change/:token", 
    (loginContoller.chageToken)
);


router.post(
    "/final", 
    (loginContoller.finallogin)
);


module.exports = router;