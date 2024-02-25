const pg = require("pg");
const nodemailer = require("nodemailer");
const bcrypt =  require("bcrypt");
const jwt = require('jsonwebtoken');
require('dotenv').config();
// const app = express();
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:process.env.DBNAME,
    password:process.env.DBPASS,
    port:5432,
});
db.connect(); 

var userName,OTP;
// all functions

// Login the admin
const saltRounds = 10;
let roles,finalRole,departments;

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
        const tokenvalue = new Promise(async (resolve, reject) => {
            // Assuming you want to resolve this Promise with the token Promise
            resolve(token);
        });
        console.log(tokenvalue);

            // token = resolve(jwtToken);
            console.log("insert token function : " ,token);

        await db.query('INSERT INTO resetPass (Employeeid, resettoken, expiration) VALUES ($1, $2, $3)', [EmployeeId, token, expirationTimestamp]);
    } catch (error) {
        console.error('Error inserting token into database:', error);
    }
}

async function findRoleName(roleID){
    for(let i=0; i<roles.length; i++){
        if(roles[i].roleid==roleID){
            return roles[i].rolename;
        }
    }
}

// Function to generate a JWT token with user identifier (e.g., email or user ID) as payload
async function generateResetToken(employeeID) {
    const token = jwt.sign({ userId: employeeID }, process.env.JWT_SECRET); 
    return token;
}

// Function to verify the JWT token provided by the user
async function verifyResetToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
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
            req.flash("success","Check your Registered Email account")
            console.log('Email sent: ' + info.response);
        }
    });
}

async function otp(){
    OTP = Math.floor(100000 + Math.random() * 900000)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
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



// login 
// render  login page 
module.exports.renderLogin = async (req, res) => {
    console.log("in root");
    res.render("./pages/login.ejs");
};


// forgot password
// render forget password
module.exports.renderForgotpass = async (req, res) => {
    res.render("./pages/forgetPass.ejs");
}

//forgot password  
module.exports.forgotpass = async (req, res) => {
    const  {employeeID}  = req.body;
    console.log(employeeID)
    try {
        const user = (await db.query("SELECT * FROM credentials WHERE employeeid = $1", [employeeID])).rows;
        if (user.length === 0) {
            // User not found, redirect back to the forgot password page with an error message
            req.flash("error","User not found please Enter Valid Information");
            res.render("./pages/forgetPass.ejs", { error: "User not found" });
            return;
        }
    }
    catch (error) {
        console.error("Error processing forgot password request:", error);
        res.status(500).send("Internal Server Error");
    }
    // Generate a reset token for the user
    const resetToken = await generateResetToken(employeeID);
    console.log( "inside forgot pass : " , resetToken);
    insertToken(employeeID, resetToken);
    const Email = (await db.query('Select Email from Employees where EmployeeId = $1',[employeeID])).rows;
    console.log("EMAIL")
    console.log(Email)
    const Subject = "PASSWORD RESET";
    const html = `Click "http://localhost:3000/reset-password/`+resetToken+`> here to reset your password.`
    SendMailforReset(Email[0].email,html,Subject);
    res.render("./pages/mailSent.ejs");
};

// reset password -> send  token 
module.exports.resetPasswordToken = async (req, res) => {
    const token = req.params.token;
    console.log(token);
    
    // Verify the reset token provided by the user
    const decodedToken = await verifyResetToken(token);

    if (!decodedToken || !decodedToken.userId) {
        // If the token is invalid or doesn't contain the required information, return an error response
        return res.status(400).send('Invalid or expired token');
    }

    // Check if the token exists in the database and is not expired
    try {
        await db.query('Delete  from resetPass where expiration < NOW()');
        const result = await db.query('SELECT * FROM resetPass WHERE resettoken = $1 AND expiration > NOW()', [token]);
        console.log(result.rows)
        if (result.rows.length == 0) {
            console.log("expression");
            // Token not found in the database or expired, render an error page
            return res.render('./pages/resetError.ejs', { error: 'Invalid or expired token' });
        }

        // Render the password reset form/page, passing the token as a hidden input field
        res.render('./pages/changePass.ejs', { token });
    } 
    catch (error) {
        console.error('Error verifying reset token:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports.register = async (req, res) => {
    console.log(req.body);
    var check=[];
    const employeeName = req.body.employeeName;
    try{
        check = (await db.query("Select * from Credentials where EmpId = $1",[employeeName])).rows;
        console.log(check);
        
        //If user does not exists
        if (check.length == 0) {
            //await db.query("Insert into Credential values($1,'user',$2)",[employeeName,hash])
            const name=employeeName;
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
};

module.exports.verify =  async (req, res) => {
    
    var check=[];
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
    if (check.length === 0) {
        req.flash("error","Username does not exist");
        res.redirect("/");
        console.log("User does not exist");
    } 
    else {
        //if login for  1st time
        if(userName === password){
            bcrypt.compare(userName, check[0].password, function (err, result){
                if (result===true) {
                    res.render("./pages/changePass.ejs");
                    console.log("password Changed");
                }else{
                    req.flash("error","Invalid")
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
                    finalRole = await findRoleName(id[0].roleid);
                    console.log(finalRole)
                    console.log(check);
                    console.log(check.length);
                }
                catch(err){
                    console.log(err);
                }
                if (result === true) {
                    if(finalRole.toLowerCase() == "admin"){
                        otp();
                        req.flash("success","OTP sent successfully");
                        res.render("./pages/otp.ejs",{OTP : OTP});
                    }else{
                        //Render the  normal user page
                        req.flash("success","Welcome Back...");
                        res.redirect(`./emp/${user}`);
                    }
                }
                else{
                    req.flash("error","Username or Password Incorrect");
                    res.redirect("/");
                    console.log("login page");
                } 
            });
    }
}
};

module.exports.chageToken = async (req, res) => {
    const token = req.params.token;
    const decodedToken = await verifyResetToken(token);

    if (!decodedToken || !decodedToken.userId) {
        // If the token is invalid or doesn't contain the required information, render an error page
        return res.render('./pages/resetError.ejs', { error: 'Invalid or expired token' });
    }

    const newPassword = req.body.Pass;

    // Hash the new password
    bcrypt.hash(newPassword, saltRounds, async function (err, hash) {
        if (err) {
            console.error('Error hashing password:', err);
            // Render an error page if there's an issue with hashing the password
            return res.render('./pages/resetError.ejs', { error: 'Internal Server Error' });
        }
        
        try {
            // Update the user's password in the database using the decoded token's userId
            await db.query("UPDATE credentials SET password = $1 WHERE employeeid = $2", [hash, decodedToken.userId]);


            // Redirect the user to a page indicating that their password has been successfully reset
            res.redirect("/")
        } catch (error) {
            console.error('Error updating password:', error);
            // Render an error page if there's an issue with updating the password in the database
            res.render('./pages/resetError.ejs', { error: 'Internal Server Error' });
        }
    });
};

module.exports.finallogin = async (req, res) => {
    console.log(req.body);
    const enteredOTP = req.body.digit1 + req.body.digit2 + req.body.digit3 +req.body.digit4 +req.body.digit5 +req.body.digit6;
    console.log(enteredOTP);
    console.log(OTP);
    if(enteredOTP == OTP){
        //Render the Admin Page
        finalRole="admin";
        req.flash("success","welcome back...");
        res.render("./pages/Admin/admin.ejs");
    }else{
        req.flash("error","Incorrect OTP Please Try Again...");
        res.render("./pages/otp.ejs");
    }
};

