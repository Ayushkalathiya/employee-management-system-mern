const express = require('express');
const app = express();
const router = express.Router();
const bodyParser =  require('body-parser');
// const pg = require("pg");
// const db = new pg.Client({
//     user:"postgres",
//     host:"localhost",
//     database:process.env.DBNAME,
//     password:process.env.DBPASS,
//     port:5432,
// });
// db.connect();


const wrapAsync = require('../utils/wrapAsync.js');

app.use(bodyParser.urlencoded({extended: true}));

const employeeController = require("../controllers/employee.js");


// use  request ->   /emp/:id -> for find userId error
router.get(
    "/:id",
    wrapAsync(employeeController.dashboard) 
);

// for profile -> render and add profile
router
    .route("/:id/profile")
    .get(wrapAsync(employeeController.renderProfile))
    .post(wrapAsync(employeeController.addProfile));


// for leave render and add leave 
router 
    .route("/:id/leave")
    .get(wrapAsync(employeeController.renderLeaveApp))
    .post(wrapAsync(employeeController.createLeave));

    router.get(
        "/:id/profile",
        wrapAsync(employeeController.renderProfile) 
    );

module.exports = router;