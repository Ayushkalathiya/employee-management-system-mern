// for postgres connection
const pg = require("pg");
const db = new pg.Client({
    user:  "postgres",
    host:  "localhost",
    database:  process.env.DBNAME,
    password:  process.env.DBPASS,
    port:  5432,
});
db.connect();

// Dashboard
// Disply all leave
module.exports.dashboard = async (req, res) => {
    id = req.params.id;
    // console.log("into empoyee route", id);

    // get all leaves

    // let leave =  await db.query("Select *from leaverequests where employeeid=$1",[id]);
    let leave = await db.query("SELECT * FROM leaverequests where employeeid=$1 ORDER BY CASE status WHEN 'Pending' THEN 1 WHEN 'Approve' THEN 2 WHEN 'Reject' THEN 3 ELSE 4 END ", [id]);

    // console.log(leave.rows);
    let leavereq = [];
    leave.rows.forEach((row) => {
        leavereq.push(row);
    });
    // console.log(leavereq[0].employeeid);
    res.render("./pages/Employee/dashboard.ejs", { id, leavereq });

};

// render profile page
module.exports.renderProfile = async (req, res) => {
    let id = req.params.id;
    
   
    
    // get all data of employee
    let emp = await db.query("SELECT *FROM employees where employeeid=$1",[id]);
    // console.log(emp.rows); 

    // object data in array
    let empData = [];
    emp.rows.forEach((row)=>{
        empData.push(row);
    });

    // Add one day 
    const date = new Date(empData[0].dob);
    date.setDate(date.getDate() + 1);
    empData[0].dob = date.toISOString();

    // get departmate name
    let dept_name = await db.query("SELECT deptname FROM departments WHERE deptid= $1 ", [empData[0].deptid]);

     // object data in array
     let dept = dept_name.rows;

    // get role name
    let role_name = await db.query("SELECT rolename FROM roles WHERE roleid= $1 ", [empData[0].roleid]);
    let role = role_name.rows;

    res.render("./pages/Employee/Emp_profile.ejs", { id,error: false,empData,dept,role});
};

// update profile 
module.exports.updateProfile = async (req, res) => {

    let id = req.params.id;

    // for read file of photo 
    let url = req.file.path;
    let filename = req.file.filename;

    console.log(url);
    console.log(filename);

    // for read file of photo 
    // let url = req.file.path;
    // let filename = req.file.filename;
    // console.log(url);
    // get updated data
    // mobile no, Address, DOB
    let gender = req.body.gender;
    let dob = req.body.date_of_birth;
    let Address = req.body.address;
    let Mo = req.body.mobile;

    console.log("Update : " + dob);
    
    let emp = await db.query("UPDATE employees SET dob=$1,gender=$2,address=$3,phone=$4 WHERE employeeid=$5",[dob,gender,Address,Mo,id]);

    req.flash("success","Profile updated successfully");
    res.redirect(`/emp/${id}`);
}


// render leave page
module.exports.renderLeaveApp = async (req, res) => {
    let id = req.params.id;
    res.render("./pages/Employee/leave.ejs",{id});
};

// create leave
module.exports.createLeave = async(req,res)=>{
    
    // Today date
    let today = new Date().toISOString();
    today = today.substring(0,10);
    console.log(today);
    console.log(req.body.fromDate);
    
    console.log(req.body.fromDate < today);
    let userId = req.params.id;

    console.log( "createLeave : " + userId);

     // Validate dates
     if (req.body.fromDate > req.body.toDate) {
        req.flash("error", "Start date cannot be after end date");
        console.log("Start date cannot be after end date");
        return res.redirect(`/emp/${userId}/leave`);
    }
    if (req.body.fromDate < today) {
        req.flash("error", "Start date cannot be in the past");
        console.log("Start date cannot be in the past");
        return res.redirect(`/emp/${userId}/leave`);
    }
  

    // Check if leave request already exists 
    // const existingLeave = await db.query("SELECT * FROM leaverequests WHERE EmployeeID = $1 AND StartDate >= $2 AND EndDate <= $3", [userId, req.body.fromDate, req.body.toDate]);
    //
    // console.log();
    //
    // if (existingLeave.rowCount > 0) {
    //     req.flash("error", "Leave request already exists for this date range");
    //     console.log("Leave request already exists for this date range");
    //     return res.redirect(`/emp/${userId}/leave`);
    // }


    console.log( "createLeave : " + userId);

     // Validate dates
     if (req.body.fromDate > req.body.toDate) {
        req.flash("error", "Start date cannot be after end date");
        console.log("Start date cannot be after end date");
        return res.redirect(`/emp/${userId}/leave`);
    }
    if (req.body.fromDate < today) {
        req.flash("error", "Start date cannot be in the past");
        console.log("Start date cannot be in the past");
        return res.redirect(`/emp/${userId}/leave`);
    }
  

    // Check if leave request already exists 
    let existingLeave = await db.query("SELECT * FROM leaverequests WHERE EmployeeID = $1 AND StartDate >= $2 AND EndDate <= $3", [userId, req.body.fromDate, req.body.toDate]);

    console.log();

    if (existingLeave.rowCount > 0) {
        req.flash("error", "Leave request already exists for this date range");
        console.log("Leave request already exists for this date range");
        return res.redirect(`/emp/${userId}/leave`);
    }


    console.log(req.body);
    await db.query("Insert into leaverequests(EmployeeID,LeaveType,StartDate,EndDate,Status,Description,applieddate) values($1,$2,$3,$4,$5,$6,$7)",
        [userId, req.body.leaveType, req.body.fromDate, req.body.toDate, "Pending", req.body.description, today]);

    req.flash("success", "leave added successfully");
    res.redirect(`/emp/${userId}`);
};


module.exports.renderAttandence = async (req, res) => {
    id = req.params.id;
    console.log(id);
  
    const Attendance = await db.query(
      "SELECT EmployeeID, TO_CHAR(date, 'DD/MM/YYYY') AS Date, status FROM attendence where EmployeeID=$1;",
      [id]
    );
  
    console.log("Attandence :",Attendance.rows);
  
    let countpresent = 0;
    let total = Attendance.rowCount;
  
    for (const att in Attendance) {
      if (att.status === "Present") countpresent++;
    }
  
    let totalAttendance = (countpresent / total) * 100;
    console.log("Total Attendance: ",totalAttendance," totalPresent: ",countpresent);
  
    let AttandenceRecord=Attendance.rows;
  
    res.render("./pages/Employee/viewAttendance.ejs", {
      id,
      AttandenceRecord,
      totalAttendance,
    });
  };