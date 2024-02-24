const pg = require("pg");
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:process.env.DBNAME,
    password:process.env.DBPASS,
    port:5432,
});
db.connect();

module.exports.dashboard =async(req,res)=>{
    id = req.params.id;
    console.log("into empoyee route" , id);

    // let leave =  await db.query("Select *from leaverequests where employeeid=$1",[id]);
    let leave =  await db.query("SELECT * FROM leaverequests where employeeid=$1 ORDER BY CASE status WHEN 'pending' THEN 1 WHEN 'approve' THEN 2 WHEN 'reject' THEN 3 ELSE 4 END ",[id]);
    
    console.log(leave.rows);
    let leavereq = [];
    leave.rows.forEach((row)=>{
        leavereq.push(row);
    });    
    // console.log(leavereq[0].employeeid);
    res.render("./pages/Employee/dashboard.ejs",{id,leavereq});
    
}; 

module.exports.renderProfile = async(req,res)=>{
    let id = req.params.id;
    res.render("./pages/Employee/profile.ejs",{id});
};


module.exports.renderLeaveApp =  async(req,res)=>{
    let id = req.params.id;
    res.render("./pages/Employee/leave.ejs",{id});
};

module.exports.createLeave = async(req,res)=>{
    
    // Today date
    let today = new Date();
    let userId = req.params.id;

    console.log(req.body);
    await db.query("Insert into leaverequests(EmployeeID,LeaveType,StartDate,EndDate,Status,Description,applieddate) values($1,$2,$3,$4,$5,$6,$7)",
    [userId,req.body.leaveType,req.body.fromDate,req.body.toDate,"pending",req.body.description,today]);
    
    req.flash("success","leave added successfully");
    res.redirect(`/emp/${userId}`);
};

module.exports.addProfile =  async(req, res) => {
    // get all from data of Emplyoee
    const Emp_id = req.body.employeeId;
    const F_name = req.body.firstName;
    const L_name = req.body.lastName;
    const Dept_name = req.body.department;
    const finaldeptid = departments.find(dept => dept.deptname == Dept_name).DeptID;
    const Email = req.body.email;
    const Mo_no = req.body.mobile;
    let userRoleToBeAdded = roles.find(role => role.roleName == userRoleToBeAdded).roleID;
    // const country = req.body.country;
    // const Stat = req.body.state;
    // const City = req.body.city;
    const DOB = req.body.dob;
    const DOJ = req.body.doj;
    // const Add = req.body.address;
    
    console.log(Dept_name);
    
    try{
        await db.query("INSERT INTO employees (EmployeeID,FirstName,LastName,DOB,Email,Roleid,Deptid,DOJ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [Emp_id,F_name,L_name,DOB,Email,userRoleToBeAdded,finaldeptid,DOJ]);
        res.redirect("/emp");
    }catch(err){
        console.log(err);
    }
    
}