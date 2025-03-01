const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const dotenv = require('dotenv')
const SibApiV3Sdk = require('sib-api-v3-sdk');
const app = express()

// port
const port = process.env.PORT || 3000;

// Default Configurations
dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json());

// DataBase Connection Setup
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.RAILWAY_PORT
})
connection.connect()

// Utilities Functions

// Default Route 
app.get('/', (req, res) => {
  res.send("Server is working properly!");
})
// SignUp Route to store Data
app.post('/signUp', (req, res, next) => {
    const {email, contact, password} = req.body;
    connection.query(`SELECT * FROM usersDetails WHERE (email = '${email}' OR contact='${contact}')`, (err, records)=>{
        if (err) throw err;

        if (records.length > 0)
        {
            console.log("User already exists!");  
            res.json({isUserExist: true});
        }
        else 
        {
          connection.query(`INSERT INTO usersDetails(name, email, contact, password) VALUES('${email.split('@')[0]}', '${email}', '${contact}', '${password}')`, (err, records, fields)=>{
            if (err) throw err;
            else {
                console.log("User Account is created successfully!");
                res.json({isUserExist: false})
            }
        })
      }
    })
    
})
// route to send the email
app.post('/verification', async(req, res, next) => {
  try
  {
    const {email} = req.body;
    const verificationKey = Math.floor(100000 + Math.random() * 900000);
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.API_KEY;
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // Email settings
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "Verify Your Code Now!";
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <p>Hello,</p>
          <p>Your verification code is: <strong>${verificationKey}</strong></p>
          <p>This code is valid for 10 minutes. Please do not share it with anyone.</p>
          <p>If you didn’t request this, please ignore this email.</p>
        </body>
      </html>`;
    sendSmtpEmail.sender = { name: "Cabbie", email: "m.haseeb120863@gmail.com" };
    sendSmtpEmail.to = [{ email: email }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent:", data);
    res.json({verificationKey: verificationKey});
  }
    
  catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Error sending verification email");
  }
})
app.post('/signIn', (req, res, next) => {
    const { email, password } = req.body;
    connection.query(`SELECT * FROM usersDetails WHERE (email='${email}' AND password='${password}')`, (err, records) => {
      if (err) throw err;

      if(records.length > 0)
      {
        res.json({isUserExist: true})
      }
      else{
        res.json({isUserExist: false})
      }
    })
})
// Route to Close Datbase Connection
app.post('/closeConnection', (req, res, next)=>{
    connection.end();
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})