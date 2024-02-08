const express =  require('express');
const bodyParser =  require('body-parser');
const pg = require("pg");
const nodemailer = require("nodemailer");
const bcrypt =  require("bcrypt");
const { Workbook } = require('exceljs');
require('dotenv').config();

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

// Login the admin
const saltRounds = 10;
let user;

app.get("/", (req, res) => {
    res.render("login.ejs");
});

app.get("/final", (req, res) => {
    //For normal User
    res.render("final.ejs");
});

app.get("/NewEmp", (req, res) => {
    if(user=="admin"){
        res.render("NewEmp.ejs");
    }
    else{
        res.redirect("/");
    }
});

app.post("/register", async (req, res) => {
    console.log(req.body);
    var check=[];
    const employeeName = req.body.employeeName;
    try{
        check = (await db.query("Select * from Credential where EmpId = $1",[employeeName])).rows;
        console.log(check);
        
        //If user does not exists
        if (check.length == 0) {
            //await db.query("Insert into Credential values($1,'user',$2)",[employeeName,hash])
            const name=employeeName;
            bcrypt.hash(name, saltRounds, async (err, hash)=> {
                await db.query("Insert into Credential values($1,'user',$2)",[employeeName,hash])
            });
            console.log(hash);
            res.redirect("/NewEmp");
        }
    }
    catch(err){
        console.log(err);
    }
});

var userName,OTP;
app.post("/verify", async (req, res) => {
    
    var check=[];
    userName = req.body.username;
    const password = req.body.password;
    console.log(userName+" "+password)
    try{
        check = (await db.query("Select * from Credential where EmpId = $1",[userName])).rows;
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
            bcrypt.compare(password, check[0].password, function (err, result) {            
                console.log(result);
                if (result == true) {
                    if(check[0].role=="admin"){
                        otp();
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

app.post("/change", async (req, res) => {
    bcrypt.hash(req.body.Pass, saltRounds, async function (err, hash) {
        try{
            await db.query("Update Credential set password=$1 where empid=$2",[hash,userName])
        }
        catch(err){
            console.log(err);
        }
    });
    res.redirect("/");
});

app.post("/final", async (req, res) => {
    console.log(req.body);
    const enteredOTP = req.body.digit1 + req.body.digit2 + req.body.digit3 +req.body.digit4 +req.body.digit5 +req.body.digit6;
    console.log(enteredOTP);
    if(enteredOTP == OTP){
        //Render the Admin Page
        user="admin";
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
    const Email = req.body.email;
    const Mo_no = req.body.mobile;
    const country = req.body.country;
    const Stat = req.body.state;
    const City = req.body.city;
    const DOB = req.body.dob;
    const DOJ = req.body.doj;
    const Add = req.body.address;
    
    console.log(Dept_name);
    
    try{
        await db.query("INSERT INTO employee VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [Emp_id,F_name,L_name,Dept_name,Email,Mo_no,country,Stat,City,DOB,DOJ,Add]);
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

app.post("/query/add",async (req,res)=>{
    query=req.body.query;
    if (query.trim() !== '') {
        vissible=1;
        const result=await db.query(query);
        answer=result.rows;
        console.log(answer);
        res.redirect("/query");
    } else {
        console.log('Please enter something in the input field.');
        res.redirect("/query");
    }
});

app.post("/query/download",(req, res)=>{
    res.redirect("/query/download");
});

app.get('/query/download', async (req, res) => {
    if(answer.length != 0) {
        try { 
            // Sample array of objects (You can replace this with your data)
            let i=0;
            // Create a new workbook
            const workbook = new Workbook();
            const worksheet = workbook.addWorksheet('Data');
            keys_headers=Object.keys(answer[0]);
            // Add headers
            const columns = keys_headers.map(key => ({ header: key.charAt(0).toUpperCase() + key.slice(1), key, width: 15 }));
            worksheet.columns = columns;
            // Add data
            worksheet.addRows(answer);
            
            // Generate Excel file and send as a response
            res.setHeader('Content-Type', '=-0987 /vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment;filename=${query}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
            res.redirect("/query");
        }catch (error) {
            res.status(500).send('Internal Server Error');
        }
    }else{
        res.redirect("/query");
    }
});

app.listen(port, ()=>{
    console.log(`port no : ${port}`);
})