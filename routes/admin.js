const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const adminController = require("../controllers/admin.js");



router.get(
    "/leave",
    wrapAsync(adminController.renderAllLeave)
);

// view leave requests
router.get(
    "/leave/view/:id",
    wrapAsync(adminController.viewLeave)
);

//approve leave request
router.post(
    "/leave/approve/:id" ,  
    wrapAsync(adminController.approveLeave)
); 

//reject leave request
router.post(
    "/leave/reject/:id" , 
    wrapAsync(adminController.rejectLeave)
);

router.get(
    "/addEmp",
    wrapAsync(adminController.addEmployeePage)
);

router.post(
    "/add",
    wrapAsync(adminController.addEmployee)
);



router.get(
    "/query",
    wrapAsync(adminController.queryPage)
);

router.post(
    "/query/add",
    wrapAsync(adminController.queryAdd)
)

router.get(
    "/query/export/excel",
    wrapAsync(adminController.queryExportExcel)
)

// router.get(
//     "/query/export/pdf",
//     wrapAsync(adminController.queryExportPdf)
// )






module.exports = router;