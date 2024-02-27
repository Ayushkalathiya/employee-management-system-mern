const pg = require("pg");
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:process.env.DBNAME,
    password:process.env.DBPASS,
    port:5432,
});
db.connect();

// render All Employee Leave
module.exports.renderAllLeave = async(req, res)=>{
    let leave =  await db.query("SELECT * FROM leaverequests ORDER BY CASE status WHEN 'Pending' THEN 1 WHEN 'Approve' THEN 2 WHEN 'Reject' THEN 3 ELSE 4 END");
    console.log(leave.rows);
    let allreq = [];
    leave.rows.forEach((row)=>{
        allreq.push(row);
    });
    console.log(allreq);
    res.render("./pages/admin/leave_req.ejs",{allreq});
};

// view Employee one leave
module.exports.viewLeave = async(req, res)=>{
    let leaveid = req.params.id;

    let leave =  await db.query("Select *from leaverequests where leaverequestid=$1 ",[leaveid]);
    console.log(leave.rows);
    let allreq = [];
    leave.rows.forEach((row)=>{
        allreq.push(row);
    });
    console.log("View Request : ", allreq);
    res.render("./pages/admin/view_leave.ejs",{allreq});
};


// Approve leave
module.exports.approveLeave = async(req,res)=>{
    console.log("Approve :");
    let leaveid = req.params.id;
    console.log(leaveid);

    let leave =  await db.query("Update leaverequests set status='Approve' where leaverequestid=$1",[leaveid]);
    console.log(leave.rows);
    res.redirect("/admin/leave");
};

// reject leave
module.exports.rejectLeave = async(req,res)=>{
    console.log("Reject :");
    let leaveid = req.params.id;
    let leave =  await db.query("Update leaverequests set status='Reject' where leaverequestid=$1",[leaveid]);
    console.log(leave.rows);
    res.redirect("/admin/leave");
};

