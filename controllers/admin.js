const pg = require("pg");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { Workbook } = require("exceljs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");
const { log } = require("console");
const jwt = require("jsonwebtoken");

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: process.env.DBNAME,
  password: process.env.DBPASS,
  port: 5432,
});
db.connect();

let employees, employeeIDArray;
async function main() {
  try {
    // Add your logic here to check if the employee ID exists in the database
    employees = await db.query("SELECT EmployeeID from employees");
    employeeIDArray = employees.rows;
    console.log(employeeIDArray);
  } catch (error) {
    console.error(`Error checking employee existence: ${error}`);
  }
}
main();

async function generateEmployeeToken(
  EmpID,
  EmpFName,
  EmpLName,
  EmpEmail,
  roleID,
  EmpPosition,
  EmpSal,
  EmpDepartment
) {
  const token = await jwt.sign(
    {
      EmpID: EmpID,
      EmpFName: EmpFName,
      EmpLName: EmpLName,
      EmpEmail: EmpEmail,
      roleID: roleID,
      EmpPosition: EmpPosition,
      EmpSal: EmpSal,
      EmpDepartment: EmpDepartment,
    },
    process.env.JWT_SECRET
  );
  return token;
}

async function verifyEmployeeToken(token) {
  console.log("The provided Token is:" + token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Assuming you have a function to check if an employee ID exists in your database
async function checkExistence(employeeID) {
  console.log("in" + employeeID);
  try {
    // Add your logic here to check if the employee ID exists in the database
    let employees = await db.query(
      "SELECT EmployeeID from employees where employeeID=$1",
      [employeeID]
    );
    return employees.rowCount === 0; // Return true if non-existent, false otherwise
  } catch (error) {
    console.error(`Error checking employee existence: ${error}`);
    return false; // Default to false if an error occurs
  }
}

// render profile page
module.exports.renderProfile = async (req, res) => {
  let id = req.params.id;

  // get all data of employee
  let emp = await db.query("SELECT *FROM employees where employeeid=$1", [id]);
  // console.log(emp.rows);
  // get all data of employee
  let emp1 = await db.query("SELECT *FROM employees where employeeid=$1", [id]);
  let img = await db.query(
    "SELECT image_url FROM emp_image WHERE employeeid=$1",
    [id]
  );
  // console.log(emp.rows);
  if (img.rowCount == 0) {
    img = null;
  } else {
    img = img.rows[0].image_url;
  }

  // object data in array
  let empData = [];
  emp.rows.forEach((row) => {
    empData.push(row);
  });

  // Add one day
  const date = new Date(empData[0].dob);
  date.setDate(date.getDate() + 1);
  empData[0].dob = date.toISOString();

  // get departmate name
  let dept_name = await db.query(
    "SELECT deptname FROM departments WHERE deptid= $1 ",
    [empData[0].deptid]
  );

  // object data in array
  let dept = dept_name.rows;

  // get role name
  let role_name = await db.query(
    "SELECT rolename FROM roles WHERE roleid= $1 ",
    [empData[0].roleid]
  );
  let role = role_name.rows;

  res.render("./pages/Admin/profile.ejs", {
    id,
    error: false,
    empData,
    dept,
    role,
    img,
  });
};

// update profile
module.exports.updateProfile = async (req, res) => {
  let id = req.params.id;

  console.log(id);

  let image = await db.query("SELECT * from emp_image where employeeid=$1",[id]);
  // for read file of photo
  // console.log(image);
  console.log( "image count : " , image.rowCount);

  if(image.rowCount < 1){
      let url = req.file.path;
      // let filename = req.file.filename;
      
      console.log(url);
      // console.log("Url : " + url);
      let emp_img = await db.query("insert into emp_image values($1,$2)",[id,url]);
  }


  // for read file of photo

  // let filename = req.file.filename;

  // console.log(url);
  // console.log(filename);

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

  let emp = await db.query(
    "UPDATE employees SET dob=$1,gender=$2,address=$3,phone=$4 WHERE employeeid=$5",
    [dob, gender, Address, Mo, id]
  );
 
  req.flash("success", "Profile updated successfully");
  res.redirect(`/admin/${id}/profile`);
};

// render All Employee Leave
module.exports.renderAllLeave = async (req, res) => {
  let id = req.params.id;
  let leave = await db.query(
    "SELECT * FROM leaverequests ORDER BY CASE status WHEN 'Pending' THEN 1 WHEN 'Approve' THEN 2 WHEN 'Reject' THEN 3 ELSE 4 END"
  );
  console.log(leave.rows);
  let allreq = [];
  leave.rows.forEach((row) => {
    allreq.push(row);
  });
  console.log(allreq);
  res.render("./pages/admin/leave_req.ejs", { allreq, id });
};

// view Employee one leave
module.exports.viewLeave = async (req, res) => {
  let leaveid = req.params.leaveid;
  let id = req.params.id;
  let leave = await db.query(
    "Select *from leaverequests where leaverequestid=$1 ",
    [leaveid]
  );
  console.log(leave.rows);
  let allreq = [];
  leave.rows.forEach((row) => {
    allreq.push(row);
  });
  console.log("View Request : ", allreq);
  res.render("./pages/admin/view_leave.ejs", { allreq, id });
};

// Approve leave
module.exports.approveLeave = async (req, res) => {
  let id = req.params.id;
  console.log("Approve :");
  let leaveid = req.params.leaveid;
  console.log(leaveid);

  let leave = await db.query(
    "Update leaverequests set status='Approve' where leaverequestid=$1",
    [leaveid]
  );
  console.log(leave.rows);
  res.redirect(`/admin/${id}/leave`);
};

// reject leave
module.exports.rejectLeave = async (req, res) => {
  let id = req.params.id;
  console.log("Reject :");
  let leaveid = req.params.leaveid;
  let leave = await db.query(
    "Update leaverequests set status='Reject' where leaverequestid=$1",
    [leaveid]
  );
  console.log(leave.rows);
  res.redirect(`/admin/${id}/leave`);
};

// Add a new Employee
module.exports.addEmployeePage = async (req, res) => {
  let id = req.params.id;
  let Role = await db.query("SELECT INITCAP(rolename) As rolename from roles");
  let Dept = await db.query(
    "SELECT INITCAP(deptname) As deptname from departments"
  );
  let Deptartments = Dept.rows;
  let roles = Role.rows;
  console.log(roles);
  res.render("./pages/admin/NewEmp.ejs", {
    Role: roles,
    Dept: Deptartments,
    id,
  });
};

// Add Employee Details
module.exports.addEmployee = async (req, res) => {
  let id = req.params.id;
  console.log(req.body);

  let EmpID = req.body.employeeID;
  let EmpFName = req.body.employeeFName;
  let EmpLName = req.body.employeeLName;
  let EmpPosition = req.body.employeePosition;
  let EmpEmail = req.body.employeeEmail;
  let EmpRole = req.body.employeeRole;
  let RoleID = await db.query(
    "SELECT roleid from roles where rolename=LOWER($1)",
    [EmpRole]
  );
  let roles = RoleID.rows;
  let roleID = roles[0].roleid;
  console.log(roleID);

  let EmpSal = req.body.employeeSal * 1;
  let EmpDepartment = req.body.employeeDepartment;

  const token = await generateEmployeeToken(
    EmpID,
    EmpFName,
    EmpLName,
    EmpEmail,
    roleID,
    EmpPosition,
    EmpSal,
    EmpDepartment
  );
  const link = `http://localhost:3000/verify-email/` + token;

  const joinTemplate = (link) => `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
            color: #333;
        }
        p {
            color: #666;
        }
        .btn {
            display: inline-block;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .btn:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Email Verification</h2>
        <p>Hello,</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${link}" class="btn" style="color: white">Verify Email</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Thanks,<br/>SGP Employee Management System</p>
    </div>
</body>
</html>
`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: EmpEmail,
    subject: "Verify Email",
    text: "Verify Email",
    html: joinTemplate(link),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      res.redirect(`/admin/${id}/addEmp`)
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  res.redirect(`/admin/${id}/addEmp`);
};

module.exports.verifyID = async (req, res) => {
  const { employeeID } = req.body;
  try {
    const exists = await checkExistence(employeeID);
    res.json({ check: exists });
  } catch (error) {
    console.error(`Error checking employee existence: ${error}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//sarthak
let query;
let answer = [];

let promptcheck = "true";
module.exports.queryPage = (req, res) => {
  let id = req.params.id;
  res.render("./pages/admin/query.ejs", { answer: answer, id, promptcheck });
};

const genAI = new GoogleGenerativeAI(process.env.GoogleGenerativeAI);

async function run(prompt) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent(
    `We have an Employees table in database with schema (EmployeeID text Primary Key FirstName text, LastName text, DOB date, Gender text, Email text, Phone text, Address text, RoleID int, DeptID int, DOJ date, Position text, Salary int),  another table 'Departments' which has schema DeptID('department id') int Primary Key GENERATED BY DEFAULT AS IDENTITY, (START WITH 100 INCREMENT BY 1), DeptName('department Name')text,Location text and another table 'Roles'(Note:rolename are lowercase) which has a schema of RoleID int Primary Key GENERATED BY DEFAULT AS IDENTITY  (START WITH 200 INCREMENT BY 1), RoleName text NOT NULL UNIQUE,Description text you  and an leave table have an promt "${prompt}" convert it into sql  query`
  );
  const response = result.response;

  const text = response.text().substring(6, response.text().length - 3);

  console.log(text);
  return text;
}

module.exports.queryAdd = async (req, res) => {
  let id = req.params.id;
  query = req.body.query.trim();
  if (query !== "") {
    visible = 1;
    const generatedResponse = await run(query);
    console.log("\n\n\n", generatedResponse[0], "\n\n\n");
    if (generatedResponse[1] == "S") {
      let result;
      try {
        result = await db.query(generatedResponse);
      } catch (err) {
        console.log(err);
        res.status(500).redirect(`/admin/${id}/query`);
      }
      answer = result.rows;
      console.log(answer);
      //answer=answer.map((obj)=>obj.position="employee");
      //console.log(answer);
      promptcheck = "true";
    } else {
      promptcheck = "false";
      answer = [];
    }
  } else {
    console.log("Please enter something in the input field.");
  }

  res.redirect(`/admin/${id}/query`);
};

module.exports.queryExportExcel = async (req, res) => {
  let id = req.params.id;
  if (answer.length != 0) {
    try {
      // Sample array of objects (You can replace this with your data)
      // Create a new workbook
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Data");
      let keys_headers = Object.keys(answer[0]);
      // Add headers
      worksheet.columns = keys_headers.map((key) => ({
        header: key.charAt(0).toUpperCase() + key.slice(1),
        key,
        width: 15,
      }));
      // Add data
      worksheet.addRows(answer);

      // Generate Excel file and send as a response
      res.setHeader(
        "Content-Type",
        "=-0987 /vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment;filename=${query}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
      res.redirect(`/admin/${id}/query`);
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect(`/admin/${id}/query`);
  }
};

//module.export.queryExportPdf=async (req, res) => {
//     try {
//         // Create a new PDF document
//         const doc = new PDFDocument();
//         // Set response headers
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename="table.pdf"');
//         // Pipe the PDF content to the response
//         doc.pipe(res);

//         const headers = Object.keys(answer[0]); // Assuming all objects have the same keys

//         // Define table dimensions and position
//         let startX = 30; // X-coordinate of the table start
//         let startY = 80; // Y-coordinate of the table start
//         let rowHeight = 30; // Height of each row
//         let cellPadding = 10; // Padding for each cell
//         let tableWidth = 550; // Total width of the table
//         let columnWidth = (tableWidth - (headers.length + 1) * cellPadding) / headers.length; // Width of each column

//         // Add table headers
//         doc.font('Helvetica-Bold').fontSize(12);
//         headers.forEach((header, i) => {
//             doc.text(header, startX + i * columnWidth + cellPadding, startY + cellPadding, { width: columnWidth, align: 'center' });
//         });

//         // Add table rows
//         doc.font('Helvetica').fontSize(10);
//         answer.forEach((data, rowIndex) => {
//             const rowY = startY + (rowIndex + 1) * rowHeight + cellPadding;
//             headers.forEach((key, colIndex) => {
//                 const value = data[key] ? data[key].toString() : ''; // Get cell value, convert to string
//                 doc.text(value, startX + colIndex * columnWidth + cellPadding, rowY, { width: columnWidth, align: 'center' });
//             });
//         });

//         // Draw table grid
//         doc.rect(startX, startY, tableWidth, (answer.length + 1) * rowHeight + 2 * cellPadding).stroke();

//         // Finalize the PDF and end the response
//         doc.end();
//     } catch (error) {
//         console.error('Error generating PDF:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };

let employees_attendence = [];

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
  const year = date.getFullYear();
  return `${year}/${month}/${day}`;
}

let formattedDate;

module.exports.markAttendance = async (req, res) => {
  let id = req.params.id;
  // Get the current date
  const currentDate = new Date();
  // Format the current date
  formattedDate = formatDate(currentDate);
  //week ends sunday,saterday

  // if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
  //   res.render("./pages/weekendattendence.ejs", { id: id });
  // } else {
  employees_attendence = await db.query(
    "SELECT EmployeeID ,(FirstName || ' ' || LastName) as name,DeptName from Employees e LEFT JOIN Departments d ON  e.DeptID=d.DeptID where roleid = (Select roleid from roles where roleName!='admin');"
  );
  console.log(employees_attendence.rows);
  res.render("./pages/admin/markAttendance.ejs", {
    employees: employees_attendence.rows,
    date: formattedDate,
    id,
  });
  // }
};

async function employeesonleave(todayDate) {
  let result = await db.query(
    "SELECT EmployeeID FROM LeaveRequests WHERE Status = 'Approve' AND EndDate>=$1",
    [todayDate]
  );

  return result.rows;
}

module.exports.submitAttendance = async (req, res) => {
  let id = req.params.id;
  console.log("Attendance");

  // Get the current date
  const currentDate = new Date();

  // Format the current date
  const todayDate = formatDate(currentDate);

  console.log("Date :" + todayDate);

  // Get the list of all employee IDs
  const allEmployeeIds = JSON.parse(req.body.employeeIds) || [];

  // Get IDs of selected employees (those who were marked present)
  const presentEmployeeIds = req.body.attendance || [];

  // Calculate IDs of absent employees
  const absentEmployeeIds = allEmployeeIds.filter(
    (employeeid) => !presentEmployeeIds.includes(employeeid)
  );

  //employees on leave
  const findleaveEmployeesIds = await employeesonleave(todayDate);

  let leaveEmployeesIds = findleaveEmployeesIds.map((obj) => obj.employeeid);

  let filteredabsentEmployeeIds = absentEmployeeIds.filter(
    (element) => !leaveEmployeesIds.includes(element)
  );

  let filteredpresentEmployeeIds = presentEmployeeIds.filter(
    (element) => !leaveEmployeesIds.includes(element)
  );

  // Process the selected employees and mark attendance accordingly
  console.log("Present employees:", filteredpresentEmployeeIds);
  console.log("Absent employees:", filteredabsentEmployeeIds);
  console.log("Leave Employees:", leaveEmployeesIds);

  // You can store the attendance data in the database or perform any other necessary actions here
  const alreadyDoneAttendence = await db.query(
    "SELECT * from attendence where date=$1;",
    [todayDate]
  );

  //console.log(alreadyDoneAttendence+" sarthak "+alreadyDoneAttendence.rows.length);
  if (alreadyDoneAttendence.rows.length == 0) {
    //present employees
    for (let presentEmp of filteredpresentEmployeeIds) {
      const present = await db.query(
        "INSERT INTO attendence values($1,$2,$3);",
        [presentEmp, todayDate, "Present"]
      );
      console.log(present);
    }
    //absent employees
    for (let absentEmp of filteredabsentEmployeeIds) {
      const absent = await db.query(
        "INSERT INTO attendence values($1,$2,$3);",
        [absentEmp, todayDate, "Absent"]
      );
      console.log(absent);
    }

    for (let LeaveEmp of leaveEmployeesIds) {
      const leave = await db.query("INSERT INTO attendence values($1,$2,$3);", [
        LeaveEmp,
        todayDate,
        "On Leave",
      ]);
      console.log(leave);
    }
    res.render("./pages/attendanceSubmitted", { id });
  } else {
    res.render("./pages/attendencealreadydone", { id });
  }
};

let allemployees = [];

module.exports.dashboard = async (req, res) => {
  let id = req.params.id;
  allemployees = await db.query(
    `Select * from Employees e,Departments d where e.DeptID=d.DeptID and e.employeeid!=$1`,[id]
  ); 
  console.log(allemployees.rows);
  res.render("./pages/Admin/admindashboard.ejs", {
    allemployees: allemployees.rows,
    id,
  });
};

let viewEmployee123;
module.exports.dashboardViewEmp = async (req, res) => {
  const id = req.params.id;
  let empid = req.params.empid;
  console.log("Employee id: ", empid);
  viewEmployee123 = await db.query(
    "Select * from employees e,Departments d where e.DeptID=d.DeptID and e.employeeid=$1",
    [empid]
  );
  console.log("Employee Details: ", viewEmployee123.rows[0] ," \n\n");
  res.render("./pages/Admin/dashboard_viewEmp.ejs", {
    Employee: viewEmployee123.rows[0],
    id,
  });
};

module.exports.dashboardDeleteEmp = async (req, res) => {
  const id = req.params.id;
  let empid = req.params.empid;
  
  console.log(empid);

  const Emp_imagedel=await db.query("DELETE FROM emp_image WHERE employeeid=$1",[empid]);
  const Credentialsdel=await db.query("DELETE FROM credentials WHERE employeeid=$1",[empid]);
  const LeaveRequestsdel=await db.query("DELETE FROM leaverequests WHERE employeeid=$1",[empid]);
  const attendencedel=await db.query("DELETE FROM attendence WHERE employeeid=$1",[empid]);
  const reset=await db.query("DELETE FROM resetpass WHERE employeeid=$1",[empid]);
  const Employeesdel=await db.query("DELETE FROM employees WHERE employeeid=$1",[empid]);
  
  console.log("\n\n Employee :"+ empid +" is Deleted from System\n\n");
  res.redirect(`/admin/${id}/dashboard`);
};
