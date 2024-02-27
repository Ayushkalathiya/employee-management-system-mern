const pg = require("pg");
const bcrypt = require("bcrypt");
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


module.exports.addEmployeePage = async(req, res)=>{
    let Role = await db.query("SELECT INITCAP(rolename) As rolename from roles");
    let Dept = await db.query("SELECT INITCAP(deptname) As deptname from departments");
    let Deptartments = Dept.rows;
    let roles = Role.rows;
    console.log(roles)
    res.render("./pages/admin/NewEmp.ejs",{Role:roles , Dept: Deptartments});
};

module.exports.addEmployee = async(req, res)=>{
    console.log(req.body)

    let EmpID = req.body.employeeID;
    let EmpFName = req.body.employeeFName;
    let EmpLName = req.body.employeeLName;
    let EmpPosition = req.body.employeePosition;
    let EmpEmail = req.body.employeeEmail;

    let EmpDepartment = req.body.employeeDepartment;
    let DeptArray = await db.query("SELECT deptid from departments where deptname=$1",[EmpDepartment]);
    let dept = DeptArray.rows;
    let deptID;
    if(dept.length==0){
        deptID=null;
    }else{
        deptID = dept[0].deptid ;
    }
    console.log(deptID)

    let EmpRole = req.body.employeeRole;
    let RoleID = await (db.query("SELECT roleid from roles where rolename=LOWER($1)",[EmpRole]));
    let roles = RoleID.rows;
    let roleID = roles[0].roleid;
    console.log(roleID)

    let EmpSal = req.body.employeeSal*1;

    (await db.query("INSERT INTO employees (EmployeeID,FirstName,LastName,Email,Roleid,Deptid,DOJ,Position,Salary) VALUES($1,$2,$3,$4,$5,$6,NOW(),$7,$8)",
        [EmpID,EmpFName,EmpLName,EmpEmail,roleID,deptID,EmpPosition,EmpSal]))

    const saltRounds = 10;

    bcrypt.hash(EmpID, saltRounds, async (err, hash)=> {
        await db.query("Insert into Credentials values($1,$2)",[EmpID,hash])
    });
    res.redirect("/admin/addEmp")
};
