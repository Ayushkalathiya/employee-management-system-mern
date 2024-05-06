const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const adminController = require("../controllers/admin.js");
// for take image using form
const multer = require('multer');
// save image in cloud
const {storage} = require('../cloudConfig.js');
const upload = multer({storage});

router.get(
    "/:id/leave",
    wrapAsync(adminController.renderAllLeave)
);

// for profile -> render and add profile
router
    .route("/:id/profile")
    .get(wrapAsync(adminController.renderProfile))
    .post(upload.single('photo'),wrapAsync(adminController.updateProfile));

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



router.get(
    "/:id/markAttendance",
    wrapAsync(adminController.markAttendance)
)

router.post(
    "/:id/submitAttendance",
    wrapAsync(adminController.submitAttendance)
)

router.get(
    "/:id/dashboard",
    wrapAsync(adminController.dashboard)
)

router.get(
    "/:id/dashboard/view/:empid",
    wrapAsync(adminController.dashboardViewEmp)
)

router.post(
    "/:id/dashboard/view/:empid",
    wrapAsync(adminController.dashboardDeleteEmp)
)

module.exports = router;