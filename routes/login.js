const express =  require('express');
const router = express.Router();
const app = express();


const loginContoller = require("../controllers/login.js");

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