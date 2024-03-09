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
async function SendMailforReset(EmailID,Message,Subject,link){
    const reserPassTemplate = (link) => `<!DOCTYPE html>

<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<title></title>
<meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
		}

		a[x-apple-data-detectors] {
			color: inherit !important;
			text-decoration: inherit !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
		}

		p {
			line-height: inherit
		}

		.desktop_hide,
		.desktop_hide table {
			mso-hide: all;
			display: none;
			max-height: 0px;
			overflow: hidden;
		}

		.image_block img+div {
			display: none;
		}

		@media (max-width:620px) {

			.desktop_hide table.icons-inner,
			.social_block.desktop_hide .social-table {
				display: inline-block !important;
			}

			.icons-inner {
				text-align: center;
			}

			.icons-inner td {
				margin: 0 auto;
			}

			.mobile_hide {
				display: none;
			}

			.row-content {
				width: 100% !important;
			}

			.stack .column {
				width: 100%;
				display: block;
			}

			.mobile_hide {
				min-height: 0;
				max-height: 0;
				max-width: 0;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide,
			.desktop_hide table {
				display: table !important;
				max-height: none !important;
			}
		}
	</style>
</head>
<body style="background-color: #d9dffa; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d9dffa;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #cfd6f4;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 20px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="width:100%;">
<div align="center" class="alignment" style="line-height:10px">
<div style="max-width: 600px;"><img alt="Card Header with Border and Shadow Animated" src="https://i.imgur.com/ozkgRDk.jpg" style="display: block; height: auto; border: 0; width: 100%;" title="Card Header with Border and Shadow Animated" width="600"/></div>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d9dffa; background-image: url('https://i.imgur.com/0Lykoj2.png'); background-position: top center; background-repeat: repeat;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-left: 50px; padding-right: 50px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#506bec;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:38px;line-height:120%;text-align:left;mso-line-height-alt:45.6px;">
<p style="margin: 0; word-break: break-word;"><strong><span>Forgot your password?</span></strong></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#40507a;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:16px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
<p style="margin: 0; word-break: break-word;"><span>Hey, we received a request to reset your password.</span></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#40507a;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:16px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
<p style="margin: 0; word-break: break-word;"><span>Let’s get you a new one!</span></p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="0" cellspacing="0" class="button_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="padding-bottom:20px;padding-left:10px;padding-right:10px;padding-top:20px;text-align:left;">
<div align="left" class="alignment"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://www.example.com/" style="height:48px;width:212px;v-text-anchor:middle;" arcsize="34%" stroke="false" fillcolor="#506bec">
<w:anchorlock/>
<v:textbox inset="5px,0px,0px,0px">
<center style="color:#ffffff; font-family:Arial, sans-serif; font-size:15px">
<![endif]--><a href="${link}" style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#506bec;border-radius:16px;width:auto;border-top:0px solid TRANSPARENT;font-weight:undefined;border-right:0px solid TRANSPARENT;border-bottom:0px solid TRANSPARENT;border-left:0px solid TRANSPARENT;padding-top:8px;padding-bottom:8px;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:15px;text-align:center;mso-border-alt:none;word-break:keep-all;" target="_blank"><span style="padding-left:25px;padding-right:20px;font-size:15px;display:inline-block;letter-spacing:normal;"><span style="word-break:break-word;"><span data-mce-style="" style="line-height: 30px;"><strong>RESET MY PASSWORD</strong></span></span></span></a><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
</table>
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#40507a;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:14px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
<p style="margin: 0; word-break: break-word;">Didn’t request a password reset? You can ignore this message.</p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="width:100%;">
<div align="center" class="alignment" style="line-height:10px">
<div style="max-width: 600px;"><img alt="Card Bottom with Border and Shadow Image" src="https://i.imgur.com/azdGMZQ.png" style="display: block; height: auto; border: 0; width: 100%;" title="Card Bottom with Border and Shadow Image" width="600"/></div>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 20px; padding-left: 10px; padding-right: 10px; padding-top: 10px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="10" cellspacing="0" class="social_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad">
<div align="center" class="alignment">
<table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;" width="72px">
<tr>
<td style="padding:0 2px 0 2px;"><a href="https://www.instagram.com" target="_blank"><img alt="Instagram" height="32" src="https://i.imgur.com/WjzBypm.png" style="display: block; height: auto; border: 0;" title="instagram" width="32"/></a></td>
<td style="padding:0 2px 0 2px;"><a href="https://www.twitter.com" target="_blank"><img alt="Twitter" height="32" src="https://i.imgur.com/ikNKMKX.png" style="display: block; height: auto; border: 0;" title="twitter" width="32"/></a></td>
</tr>
</table>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#97a2da;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:14px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
<p style="margin: 0; word-break: break-word;">+911234567890</p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#97a2da;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:14px;line-height:120%;text-align:center;mso-line-height-alt:16.8px;">
<p style="margin: 0; word-break: break-word;">This link will expire in the next 1 hour.<br/>Please feel free to contact us at sgpemployee456@gmail.com. </p>
</div>
</td>
</tr>
</table>
<table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
<tr>
<td class="pad">
<div style="color:#97a2da;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:12px;line-height:120%;text-align:center;mso-line-height-alt:14.399999999999999px;">
<p style="margin: 0; word-break: break-word;"><span>Copyright© 2024 Employee Management System SGP.</span></p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
<tbody>
<tr>
<td>
<table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; background-color: #ffffff; width: 600px; margin: 0 auto;" width="600">
<tbody>
<tr>
<td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
<table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="pad" style="vertical-align: middle; color: #1e0e4b; font-family: 'Inter', sans-serif; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
<table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
<tr>
<td class="alignment" style="vertical-align: middle; text-align: center;"><!--[if vml]><table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
<!--[if !vml]><!-->
<table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;">
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table><!-- End -->
</body>
</html>`
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
        text: Message,
        html: reserPassTemplate(link)
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

async function otp(name,email){
    const otpTemplate =(UserName,OTP) =>`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP</title>
</head>
<body>
    <hr>
    <b>It is an auto generated email, please do not reply</b>
    <hr>
    <b>Dear ${UserName},</b>
    <br>  
    <p><b>Your One Time Password (OTP) : </b>${OTP}</p>
    <p>Use this OTP to Log in to the Employee Management System</p>
    <hr>   
</body>
</html>
`
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
        to: email,
        subject: 'OTP',
        text: "Your OTP is "+ OTP,
        html: otpTemplate(name,OTP)
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
    await insertToken(employeeID, resetToken);
    const Email = (await db.query('Select Email from Employees where EmployeeId = $1',[employeeID])).rows;
    console.log("EMAIL")
    console.log(Email)
    const Subject = "PASSWORD RESET";
    const html = `Click "http://localhost:3000/reset-password/`+resetToken+`> here to reset your password.`
    const link = `http://localhost:3000/reset-password/`+resetToken
    SendMailforReset(Email[0].email,html,Subject,link);
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
            bcrypt.compare(userName, check[0].password, async function  (err, result){
                if (result===true) {
                    let token = await generateResetToken(userName);
                    await insertToken(userName, token);
                    res.redirect(`reset-password/`+token)
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
                        let name;
                        name = (await db.query("Select CONCAT(FirstName,CONCAT(' ',LastName)) as name , Email from Employees where EmployeeId = $1",[userName])).rows;
                        otp(name[0].name,name[0].email);
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
        console.log(userName);
        res.render("./pages/Admin/admin.ejs",{id : userName});
    }else{
        req.flash("error","Incorrect OTP Please Try Again...");
        res.render("./pages/otp.ejs");
    }
};

