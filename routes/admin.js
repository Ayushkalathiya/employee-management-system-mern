const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const adminController = require("../controllers/admin.js");




router.get(
    "/:id/leave",
    wrapAsync(adminController.renderAllLeave)
);

// view leave requests
router.get(
    "/:id/leave/view/:leaveid",
    wrapAsync(adminController.viewLeave)
);

//approve leave request
router.post(
    "/:id/leave/approve/:leaveid" ,  
    wrapAsync(adminController.approveLeave)
); 

//reject leave request
router.post(
    "/:id/leave/reject/:leaveid" , 
    wrapAsync(adminController.rejectLeave)
);

router.get(
    "/:id/addEmp",
    wrapAsync(adminController.addEmployeePage)
);

router.post(
    "/:id/addEmp",
    wrapAsync(adminController.addEmployee)
);



router.get(
    "/:id/query",
    wrapAsync(adminController.queryPage)
);

router.post(
    "/:id/query/add",
    wrapAsync(adminController.queryAdd)
)

router.get(
    "/:id/query/export/excel",
    wrapAsync(adminController.queryExportExcel)
)

// router.get(
//     "/query/export/pdf",
//     wrapAsync(adminController.queryExportPdf)
// )

router.post(
    "/:id/verifyID",
    wrapAsync(adminController.verifyID)
)




module.exports = router;