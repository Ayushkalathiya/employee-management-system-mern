const express =  require('express');
const bodyParser =  require('body-parser');
const pg = require("pg");
const nodemailer = require("nodemailer");
const bcrypt =  require("bcrypt");
const { Workbook } = require('exceljs');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require('pdfkit');
const fs = require('fs');


const app = express();
const port = 3000;

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:process.env.DBNAME,
    password:process.env.DBPASS,
    port:5432,
});
db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');


// Login the admin
const saltRounds = 10;
let user,roles,finalRole,departments;

async function main(){
    try{
        roles = (await db.query("Select RoleId,RoleName from Roles")).rows;
        departments = (await db.query("Select DeptID,DeptName from Departments")).rows;
        console.log(roles)
        console.log(departments)

    } 
    catch(err){
        console.log(err);
    }
}

main();

// Function to insert the token into the database
async function insertToken(EmployeeId, token) {
    try {
        // Calculate expiration date (1 hour from now)
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 1);

        // Convert expiration date to a timestamp format
        const expirationTimestamp = expirationDate.toISOString();

        await db.query('INSERT INTO resetPass (Employeeid, resettoken, expiration) VALUES ($1, $2, $3)', [EmployeeId, token, expirationTimestamp]);
    } catch (error) {
        console.error('Error inserting token into database:', error);
    }
}

function findRoleName(roleID){
    for(let i=0; i<roles.length; i++){
        if(roles[i].roleid==roleID){
            return roles[i].rolename
        }
    }
}

// Function to generate a JWT token with user identifier (e.g., email or user ID) as payload
function generateResetToken(employeeID) {
    const token = jwt.sign({ userId: employeeID }, process.env.JWT_SECRET); 
    return token;
}

// Function to verify the JWT token provided by the user
function verifyResetToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
async function SendMailforReset(EmailID,Message,Subject){
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: EmailID,
        subject: Subject,
        text: Message
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

app.get("/", (req, res) => {
    res.render("login.ejs");
});

app.get("/forgot", async (req, res) => {
    res.render("forgetPass.ejs");
});

app.post("/forgot", async (req, res) => {
    const  {employeeID}  = req.body;
    console.log(employeeID)
    try {
        const user = (await db.query("SELECT * FROM credentials WHERE employeeid = $1", [employeeID])).rows;
        if (user.length === 0) {
            // User not found, redirect back to the forgot password page with an error message
            res.render("forgetPass.ejs", { error: "User not found" });
            return;
        }
    }
    catch (error) {
        console.error("Error processing forgot password request:", error);
        res.status(500).send("Internal Server Error");
    }
    // Generate a reset token for the user
    const resetToken = await generateResetToken(employeeID);
    await insertToken(employeeID, resetToken);
    const Email = (await db.query('Select Email from Employees where EmployeeId = $1',[employeeID])).rows;
    console.log("EMAIL")
    console.log(Email)
    const Subject = "PASSWORD RESET";
    const html = `Click "http://localhost:3000/reset-password/`+resetToken+`> here to reset your password.`
    try{
        await SendMailforReset(Email[0].email,html,Subject);
    }
    catch (error){
        console.log(error)
    }
    res.render("mailSent.ejs");
});

app.get('/reset-password/:token', async (req, res) => {
    const token = req.params.token;
    console.log(token);
    
    // Verify the reset token provided by the user
    const decodedToken = verifyResetToken(token);

    if (!decodedToken || !decodedToken.userId) {
        // If the token is invalid or doesn't contain the required information, return an error response
        return res.status(400).send('Invalid or expired token');
    }

    // Check if the token exists in the database and is not expired
    try {
        await db.query('Delete from resetPass where expiration < NOW()');
        const result = await db.query('SELECT * FROM resetPass WHERE resettoken = $1 AND expiration > NOW()', [token]);
        console.log(result.rows)
        if (result.rows.length === 0) {
            // Token not found in the database or expired, render an error page
            return res.render('resetError.ejs', { error: 'Invalid or expired token' });
        }

        // Render the password reset form/page, passing the token as a hidden input field
        res.render('changePass.ejs', { token });
    } 
    catch (error) {
        console.error('Error verifying reset token:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get("/final", (req, res) => {
    //For normal User
    res.render("final.ejs");
});


app.get("/NewEmp", (req, res) => {
    res.render("NewEmp.ejs");
});

app.post("/register", async (req, res) => {
    console.log(req.body);
    let check=[];
    const employeeName = req.body.employeeName;
    try{
        check = (await db.query("Select * from Credentials where EmpId = $1",[employeeName])).rows;
        console.log(check);
        
        //If user does not exists
        if (check.length == 0) {
            //await db.query("Insert into Credential values($1,'user',$2)",[employeeName,hash])
            bcrypt.hash(name, saltRounds, async (err, hash)=> {
                await db.query("Insert into Credentials values($1,$2)",[employeeName,hash])
            });
            console.log(hash);
            res.redirect("/NewEmp");
        }
    }
    catch(err){
        console.log(err);
    }
});

let userName,OTP;

app.post("/verify", async (req, res) => {
    
    let check=[];
    userName = req.body.username;
    const password = req.body.password;
    console.log(userName+" "+password)
    try{
        check = (await db.query("Select * from Credentials where EmployeeId = $1",[userName])).rows;
        console.log(check);
        console.log(check.length);
    }
    catch(err){
        console.log(err);
    }
    
    //If user does not exists
    if (check.length == 0) {
        res.redirect("/");
        console.log("User does not exist");
    } 
    else {
        //if login for  1st time
        if(userName == password){
            bcrypt.compare(userName, check[0].password, function (err, result){
                if (result==true) {
                    res.render("changePass.ejs");
                    console.log("password Changed");
                }else{
                    res.redirect("/");
                    console.log("redirect at login page");
                }
            });
        }else{
            user=userName;
            bcrypt.compare(password, check[0].password, async function (err, result) {            
                console.log(result);
                let id;
                try{
                    id = (await db.query("Select roleID from Employees where EmployeeId = $1",[userName])).rows;
                    console.log(id)
                    // finalRole = roles.find(role => role.roleid == id[0].roleid).rolename;
                    finalRole = findRoleName(id[0].roleid);
                    console.log(finalRole)
                    console.log(check);
                    console.log(check.length);
                }
                catch(err){
                    console.log(err);
                }
                if (result == true) {
                    if(finalRole=="admin"){
                        await otp();
                        res.render("otp.ejs",{OTP : OTP});
                    }else{
                        //Render the  normal user page
                        res.redirect("/emp");
                    }
                }
                else{
                    res.redirect("/");
                    console.log("login page");
                } 
            });
    }
}
});

app.post("/change/:token", async (req, res) => {
    const token = req.params.token;
    const decodedToken = verifyResetToken(token);

    if (!decodedToken || !decodedToken.userId) {
        // If the token is invalid or doesn't contain the required information, render an error page
        return res.render('resetError.ejs', { error: 'Invalid or expired token' });
    }

    const newPassword = req.body.Pass;

    // Hash the new password
    bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
        if (err) {
            console.error('Error hashing password:', err);
            // Render an error page if there's an issue with hashing the password
            return res.render('resetError.ejs', { error: 'Internal Server Error' });
        }
        
        try {
            // Update the user's password in the database using the decoded token's userId
            await db.query("UPDATE credentials SET password = $1 WHERE employeeid = $2", [hash, decodedToken.userId]);
            await db.query("DELETE FROM resetpass WHERE employeeid = $1",[decodedToken.userId])
            // Redirect the user to a page indicating that their password has been successfully reset
            res.redirect("/")
        } catch (error) {
            console.error('Error updating password:', error);
            // Render an error page if there's an issue with updating the password in the database
            res.render('resetError.ejs', { error: 'Internal Server Error' });
        }
    });
});


app.post("/final", async (req, res) => {
    console.log(req.body);
    const enteredOTP = req.body.digit1 + req.body.digit2 + req.body.digit3 +req.body.digit4 +req.body.digit5 +req.body.digit6;
    console.log(enteredOTP);
    if(enteredOTP == OTP){
        //Render the Admin Page
        finalRole="admin";
        res.render("admin.ejs");
    }else{
        res.render("otp.ejs");
    }
});

async function otp(){
    OTP = Math.floor(100000 + Math.random() * 900000)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });
    
    const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.RecEMAIL,
        subject: 'OTP',
        text: "Your OTP is "+ OTP
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


app.get("/emp", async(req,res)=>{
    
    res.render("employee.ejs",{user});
    
});

app.get("/emp/profile" , async(req,res)=>{
    res.render("profile.ejs");
});
app.post("/emp/profile/add", async(req, res) => {
    // get all from data of Emplyoee
    const Emp_id = req.body.employeeId;
    const F_name = req.body.firstName;
    const L_name = req.body.lastName;
    const Dept_name = req.body.department;
    const finaldeptid = departments.find(dept => dept.deptname == Dept_name).DeptID;
    const Email = req.body.email;
    // const Mo_no = req.body.mobile;
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
    
});

//sarthak
let query;
let answer=[];
app.get("/query", (req, res) => {
  res.render("query.ejs",{answer:answer});
});

const genAI = new GoogleGenerativeAI(process.env.GoogleGenerativeAI);

async function run(prompt) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await model.generateContent(`we have an Employees table in database with schema (EmployeeID text Primary Key FirstName text, LastName text, DOB date, Gender text, Email text, Phone text, Address text, RoleID int, DeptID int, DOJ date, Position text, Salary int) you have an promt${prompt} convert it into sql query`);
    /*    another table 'Departments' which has schema DeptID('department id') int Primary Key GENERATED BY DEFAULT AS IDENTITY, (START WITH 100 INCREMENT BY 1), DeptName('department Name')text,
	Location text and another table 'Roles' which has a schema of RoleID int Primary Key GENERATED BY DEFAULT AS IDENTITY  (START WITH 200 INCREMENT BY 1), RoleName text NOT NULL UNIQUE,Description text */
  const response = await result.response;

  const text = response.text().substring(6,response.text().length-3);
  console.log(text);
  return text;
}

app.post("/query/add",async (req,res)=>{
    query=req.body.query.trim();
    if (query!== '') {
        visible = 1;
        const generatedResponse = await run(query);
        let result;
        try{
        result = await db.query(generatedResponse);
        }catch(err){
            console.log(err);
            res.status(500).redirect('/query');
        }
        answer = result.rows;
        console.log(answer);
        res.redirect("/query");
    } else {
        console.log('Please enter something in the input field.');
        res.redirect("/query");
    }
});
app.get('/query/export/excel', async (req, res) => {
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
        }catch (error) {
            res.status(500).send('Internal Server Error');
        }
    }else{
        res.redirect("/query");
    }
});


// app.get('/query/export/pdf', async (req, res) => {
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
// });

app.listen(port, ()=>{
    console.log(`port no : ${port}`);
})