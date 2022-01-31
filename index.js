// import and name downloaded module 
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("Cookie-parser");
const mongoose = require("mongoose");
//create and exprss object and store it into the vaiable app
//can use app to create API routes
const app = express();
const User = require("./models/UserObjects");
const {registerValidation} = require("./validation");
//allows account info to be stored and modifired throguh a json object
let Accounts = [];

// allows useage of .env files,  DO NOT USE LINE IN PROUNTUATION 
require("dotenv").config();

// using the modules as middlewear funtion to parse cookies for us to use
app.use(express.json());

// to parse req.boby into a json object.
app.use(cookieParser());

mongoose.connect(process.env.MONGO_CONNECT, {
    useNewUrlParser: true,
    useUnifedTopology: true
}, () => {
    console.log("connect to db!");
});
//listening for a requests and excutes the function 
app.get("/", (req, res) => {
    // send intex.html file to the user for their brower to render 
    res.sendFile(path.join(__dirname, "public", "index.html"))
})

// creates a middleware duntion namde TokenCheck
const TokenCheck = (req, res, next) => {

    // reads the cookies from the user and stores that in the token variable  
    const token = req.cookies.authToken;
    //check if there is a cookie. if not cookie not logged in and tells the user they aren't loggec in.
    if (!token) return res.send("Error! You aren't logged in!");
    //tries to check if the token present is actually a correct token
    try {
        //grabs the TOKEN_SECRET vaivable in .env file and checks if the token mahces the password 
        const verifed = jwt.verify(token, process.env.TOKEN_SECRET);
        // store verified object into req.user so it 
        req.user = verifed;
        //moves on to the next middleware/Function 
        next();
    } catch (err) {
        console.log(err);
        res.status(400).send("Error! You aren't loggind in!");
    }
}
//listening for a GET request on/homepage, then use the ToKenCheck middleware to make sure they are logged in iF they are send back homepage html
app.get("/homepage", TokenCheck, (req, res) => {
    // sends the user the hoepate.html
    res.sendFile(path.join(__dirname, "public", "homepage.html"));
})
// listens for GET request 
app.get("/api/user/Logout", (req, res) => {
    //clear the cookies so if they try and got to aauthenticated rount they wont have the writband ot get in
    res.clearCookie("authToken");
    res.send({
        error: false
    });
})
//isten for a post request on the given route and handles the data 
app.post("/api/user/Register", async (req, res) => {
    //stores username and passwor d from the body sent from the user 
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    //checks if the password is less than 4 send an error 
    const data = {
        username: username,
        email: email,
        password: password
    }
    const {error} = registerValidation(data);
    if (error) return res.status(400).send({
        error: true,
        message: error.details[0].message
    })
    const emailExisted = await User.findOne({
        email: email
    })
    if (emailExisted) return res.status(400).send({
        error: true,
        message: "email already exists"
    })

    if (password.length < 4) return res.status(400).send({
        error: true,
        message: "Make a better password"
    });
    /*
    {
        "username":
        {
            password:
        }
    }
    */
    // check to see if there is a alread made account with the same username in the Accounts JSON object. if so send an error 
    if (Accounts[username]) return res.status(400).send({
        error: true,
        message: "this account name is taken"
    });
    //uses the bcrypt to has the passwor dna dstore that in the hashedPassword vaivable 
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
        username: username,
        email: email,
        password: hashedPassword
    })
    try {
        const savedUser = await user.save();
        //hashes and create a token with the json object username
    const token = jwt.sign({
        _id: savedUser._id
    }, process.env.TOKEN_SECRET);

    //clear the cookie
    res.clearCookie("authToken");
    //sents the cookies as the token with ertain security parameters 
    res.cookie(
        "authToken",
        token, {
            maxAge: 900000000,
            httpOnly: true
        }
    )
    //sends the error and send the token
    res.send({
        error: false,
        message: token
    });
    } 
    catch (error) {
        res.status(400).send({
            error: true,
            message: error.message
        });
    }
    // create a new JSON object with the key name as the username and value as a json object with the password 
    // Accounts[username] = {
    //     password: hashedPassword
    // };
    /*
    "jaxson":
    {
        password : "wejfiosjsp"
    }
    */

    
})

//listen for a post request on the login route
app.post("/api/user/login", async (req, res) => {
    //stores username and password from the body sent from the user
    const username = req.body.username;
    const password = req.body.password;
    //check if th username exsit, if not return error
    if (!Accounts[username]) return res.status(400).send({
        error: true,
        message: "Username or password incorrect"
    })
    //checks if the given passwor matches the hashed password
    const vaildPass = await bcrypt.compare(password, Accounts[username].password);
    // if vaildPass is false I(undifined) then it return the error
    if (vaildPass) return res.status(400).send({
        error: true,
        message: "username or password incorrect"
    })
    //creates a token that stores the hased username
    const token = jwt.sign({
        username: username
    }, process.env.TOKEN_SECRET);

    //clrea the cookie and sets new token as the cokie with parameter
    res.clearCookie("autoToken");
    res.cookie(
        "autoToken",
        token, {
            maxAge: 900000000,
            httpOnly: true
        }
    )
    res.send({
        error: false,
        message: token
    });
});
app.listen(3000, () => console.log("Sever Up"));