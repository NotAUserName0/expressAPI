/*
    npm init -y
    npm i express jsonwebtoken
    npm i jwt-decode
    npm i -g nodemon  
    npm install express mongoose
    npm i bcryptjs
    npm install dotenv

    npm run devStart        
    
    en el package.json, dentro de scripts : "devStart": "nodemon app.js",
*/

const express = require('express');

const app = express()

const userRoutes = require('./routes/user');
const connectDB = require('./db');

connectDB().then(
    () => {
        app.use('/user',userRoutes)

    app.get("/", (req,res)=>{
        res.json({
           message:"Chat app API"
        })
    });

    app.listen(3000,function () {
        console.log("Server On");
    })
    
    }
).catch((error) => {
    console.error('No database', error)
})

