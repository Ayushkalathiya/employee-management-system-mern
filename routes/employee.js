const express = require('express');
const app = express();
const router = express.Router();
// for take image using form
const multer = require('multer');
// save image in cloud
const {storage} = require('../cloudConfig.js');
const upload = multer({storage});

const bodyParser =  require('body-parser');
const wrapAsync = require("../utils/wrapAsync.js");

app.use(bodyParser.urlencoded({extended: true}));

const employeeController = require("../controllers/employee.js");


// use  request ->/emp/:id -> for find userId error
router.get(
    "/:id",
    wrapAsync(employeeController.dashboard) 
);

// for profile -> render and add profile
router
    .route("/:id/profile")
    .get(wrapAsync(employeeController.renderProfile))
    .post(upload.single('photo'),wrapAsync(employeeController.updateProfile));


// for leave render and add leave 
router 
    .route("/:id/leave")
    .get(wrapAsync(employeeController.renderLeaveApp))
    .post(wrapAsync(employeeController.createLeave));

router.get(
        "/:id/viewAttendance",
        wrapAsync(employeeController.renderAttandence)
    );
    


module.exports = router;
