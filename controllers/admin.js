const pg = require("pg");
const bcrypt = require("bcrypt");
const { Workbook } = require('exceljs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require('pdfkit');

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:process.env.DBNAME,
    password:process.env.DBPASS,
    port:5432,
});
db.connect();

let employees,employeeIDArray;
async function main(){
    try {
        // Add your logic here to check if the employee ID exists in the database
        employees = await db.query('SELECT EmployeeID from employees');
        employeeIDArray = employees.rows;
        console.log(employeeIDArray)
    
      } catch (error) {
        console.error(`Error checking employee existence: ${error}`);
      }
    
}
main()

// Assuming you have a function to check if an employee ID exists in your database
async function checkExistence(employeeID) {
    console.log("in"+employeeID)
    try {
      // Add your logic here to check if the employee ID exists in the database
      let employees = await db.query('SELECT EmployeeID from employees where employeeID=$1', [employeeID]);
      return employees.rowCount === 0; // Return true if non-existent, false otherwise
    } catch (error) {
      console.error(`Error checking employee existence: ${error}`);
      return false; // Default to false if an error occurs
    }
  }


// render All Employee Leave
module.exports.renderAllLeave = async(req, res)=>{
    let id = req.params.id;
    let leave =  await db.query("SELECT * FROM leaverequests ORDER BY CASE status WHEN 'Pending' THEN 1 WHEN 'Approve' THEN 2 WHEN 'Reject' THEN 3 ELSE 4 END");
    console.log(leave.rows);
    let allreq = [];
    leave.rows.forEach((row)=>{
        allreq.push(row);
    });
    console.log(allreq);
    res.render("./pages/admin/leave_req.ejs",{allreq,id});
};

// view Employee one leave
module.exports.viewLeave = async(req, res)=>{
    let leaveid = req.params.leaveid;
    let id = req.params.id;
    let leave =  await db.query("Select *from leaverequests where leaverequestid=$1 ",[leaveid]);
    console.log(leave.rows);
    let allreq = [];
    leave.rows.forEach((row)=>{
        allreq.push(row);
    });
    console.log("View Request : ", allreq);
    res.render("./pages/admin/view_leave.ejs",{allreq,id});
};


// Approve leave
module.exports.approveLeave = async(req,res)=>{
    let id = req.params.id;
    console.log("Approve :");
    let leaveid = req.params.leaveid;
    console.log(leaveid);

    let leave =  await db.query("Update leaverequests set status='Approve' where leaverequestid=$1",[leaveid]);
    console.log(leave.rows);
    res.redirect(`/admin/${id}/leave`);
};

// reject leave
module.exports.rejectLeave = async(req,res)=>{
    let id = req.params.id;
    console.log("Reject :");
    let leaveid = req.params.leaveid;
    let leave =  await db.query("Update leaverequests set status='Reject' where leaverequestid=$1",[leaveid]);
    console.log(leave.rows);
    res.redirect(`/admin/${id}/leave`);
};


module.exports.addEmployeePage = async(req, res)=>{
    let id = req.params.id;
    let Role = await db.query("SELECT INITCAP(rolename) As rolename from roles");
    let Dept = await db.query("SELECT INITCAP(deptname) As deptname from departments");
    let Deptartments = Dept.rows;
    let roles = Role.rows;
    console.log(roles)
    res.render("./pages/admin/NewEmp.ejs",{Role:roles , Dept: Deptartments,id});
};

module.exports.addEmployee = async(req, res)=>{
    let id = req.params.id;
    console.log(req.body)

    let EmpID = req.body.employeeID;
    let EmpFName = req.body.employeeFName;
    let EmpLName = req.body.employeeLName;
    let EmpPosition = req.body.employeePosition;
    let EmpEmail = req.body.employeeEmail;
    let EmpRole = req.body.employeeRole;
    let RoleID = await (db.query("SELECT roleid from roles where rolename=LOWER($1)",[EmpRole]));
    let roles = RoleID.rows;
    let roleID = roles[0].roleid;
    console.log(roleID)

    let EmpSal = req.body.employeeSal*1;
    let EmpDepartment = req.body.employeeDepartment;
    if(EmpDepartment === "NULL"){
        (await db.query("INSERT INTO employees (EmployeeID,FirstName,LastName,Email,Roleid,Deptid,DOJ,Position,Salary) VALUES($1,$2,$3,$4,$5,NULL,NOW(),$6,$7)",
        [EmpID,EmpFName,EmpLName,EmpEmail,roleID,EmpPosition,EmpSal]))
    }
    else{
        let DeptArray = await db.query("SELECT deptid from departments where deptname=$1",[EmpDepartment]);
        let dept = DeptArray.rows;
        let deptID = dept[0].deptid ;
        (await db.query("INSERT INTO employees (EmployeeID,FirstName,LastName,Email,Roleid,Deptid,DOJ,Position,Salary) VALUES($1,$2,$3,$4,$5,$6,NOW(),$7,$8)",
        [EmpID,EmpFName,EmpLName,EmpEmail,roleID,deptID,EmpPosition,EmpSal]))
    }
    

    const saltRounds = 10;

    bcrypt.hash(EmpID, saltRounds, async (err, hash)=> {
        await db.query("Insert into Credentials values($1,$2)",[EmpID,hash])
    });
    res.redirect(`/admin/${id}/addEmp`);
};

module.exports.verifyID = async(req,res)=>{
        const { employeeID } = req.body;
        try {
            const exists = await checkExistence(employeeID);
            res.json({ check: exists });
        } catch (error) {
            console.error(`Error checking employee existence: ${error}`);
            res.status(500).json({ error: 'Internal Server Error' });
        }
};

//sarthak
let query;
let answer=[];

module.exports.queryPage=(req,res)=>{
    let id = req.params.id;
    res.render("./pages/admin/query.ejs",{answer:answer,id});
};

const genAI = new GoogleGenerativeAI(process.env.GoogleGenerativeAI);

async function run(prompt) {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  
    const result = await model.generateContent(`we have an Employees table in database with schema (EmployeeID text Primary Key FirstName text, LastName text, DOB date, Gender text, Email text, Phone text, Address text, RoleID int, DeptID int, DOJ date, Position text, Salary int) you have an promt${prompt} convert it into sql select query`);
      /*    another table 'Departments' which has schema DeptID('department id') int Primary Key GENERATED BY DEFAULT AS IDENTITY, (START WITH 100 INCREMENT BY 1), DeptName('department Name')text,
      Location text and another table 'Roles' which has a schema of RoleID int Primary Key GENERATED BY DEFAULT AS IDENTITY  (START WITH 200 INCREMENT BY 1), RoleName text NOT NULL UNIQUE,Description text */
    const response = await result.response;
  
    const text = response.text().substring(6,response.text().length-3);
    console.log(text);
    return text;
}

module.exports.queryAdd=async (req,res)=>{
    let id = req.params.id;
    query=req.body.query.trim();
    if (query!== '') {
        visible = 1;
        const generatedResponse = await run(query);
        let result;
        try{
            result = await db.query(generatedResponse);
        }catch(err){
            console.log(err);
            res.status(500).redirect(`/admin/${id}/query`);
        }
        answer = result.rows;
        console.log(answer);
    } else {
        console.log('Please enter something in the input field.');
    }
    
    res.redirect(`/admin/${id}/query`);
};

module.exports.queryExportExcel= async (req, res) => {
    let id = req.params.id;
    if(answer.length != 0) {
        try { 
            // Sample array of objects (You can replace this with your data)
            // Create a new workbook
            const workbook = new Workbook();
            const worksheet = workbook.addWorksheet('Data');
            let keys_headers=Object.keys(answer[0]);
            // Add headers
            worksheet.columns = keys_headers.map(key => ({ header: key.charAt(0).toUpperCase() + key.slice(1), key, width: 15 }));
            // Add data
            worksheet.addRows(answer);
            
            // Generate Excel file and send as a response
            res.setHeader('Content-Type', '=-0987 /vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment;filename=${query}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
            res.redirect(`/admin/${id}/query`);
        }catch (error) {
            res.status(500).send('Internal Server Error');
        }
    }else{
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

    


    let employees_attendence=[];

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    
    let formattedDate;

    module.exports.markAttendance=async(req,res)=>{
        let id = req.params.id;
        // Get the current date
        const currentDate = new Date();
         // Format the current date
        formattedDate = formatDate(currentDate);
        //week ends sunday,saterday
        // if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        //     res.render("./pages/weekendattendence.ejs",{id:id})
        // }else{
            employees_attendence= await db.query("SELECT EmployeeID ,(FirstName || ' ' || LastName) as name,DeptName from Employees e,Departments d where e.DeptID=d.DeptID and roleid != 200;");
            console.log(employees_attendence.rows);
            res.render("./pages/admin/markAttendance.ejs",{employees:employees_attendence.rows,date:formattedDate,id});
        //}
    };

    module.exports.submitAttendance=async (req,res)=>{
        let id = req.params.id;
        console.log("Attendance");

        // Get the list of all employee IDs
        const allEmployeeIds = JSON.parse(req.body.employeeIds) || [];

        // Get IDs of selected employees (those who were marked present)
        const presentEmployeeIds = req.body.attendance || [];

        // Calculate IDs of absent employees
        const absentEmployeeIds = allEmployeeIds.filter(employeeid => !presentEmployeeIds.includes(employeeid));

        // Process the selected employees and mark attendance accordingly
        console.log('Present employees:', presentEmployeeIds);
        console.log('Absent employees:', absentEmployeeIds);

        // Get the current date
        const currentDate = new Date();
         // Format the current date
        const todayDate = formatDate(currentDate);    

        // You can store the attendance data in the database or perform any other necessary actions here
        const alreadyDoneAttendence=await db.query("SELECT * from attendence where date=$1;",[todayDate]);

        //console.log(alreadyDoneAttendence+" sarthak "+alreadyDoneAttendence.rows.length);
        if(alreadyDoneAttendence.rows.length == 0) {
            //present employees
            for (let presentEmp of presentEmployeeIds){
                const present= await db.query("INSERT INTO attendence values($1,$2,$3);",[presentEmp,todayDate,"Present"]);
               // console.log(present);
            }
            //absent employees
            for (let absentEmp of absentEmployeeIds){
                const absent=await db.query("INSERT INTO attendence values($1,$2,$3);",[absentEmp,todayDate,"Absent"]);
                //console.log(absent);
            }
            // Redirect to the "Attendance Submitted" page
            res.render('./pages/attendanceSubmitted',{id});
        }else{
            res.render('./pages/attendencealreadydone',{id});
        }
    };