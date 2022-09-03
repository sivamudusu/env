//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs")
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")


const app = express();
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/usersDB");
const userSchema = new mongoose.Schema({
    email:String,
    password : String
})

userSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields: ['password']});


const User = new mongoose.model("user",userSchema);


app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/register",(req,res)=>{
    res.render("register")
});
app.get("/login",(req,res)=>{
    res.render("login")
});


app.post("/register",(req,res)=>{
    const user = new User({
        email : req.body.username,
        password : req.body.password
    })
    user.save((err)=>{
        if(!err){
            res.render("secrets");
        }else{
            console.log(err);
        }
    })
})
app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username},((err,foundUser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
                

            }
        }
    }))
})



app.listen(3000,(req,res)=>{
    console.log("started on port 3000");
})