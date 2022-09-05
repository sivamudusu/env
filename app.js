//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs")
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { serializeUser, deserializeUser } = require('passport');




const app = express();
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended:true}));

app.use(session({
    secret:"our little secret.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB");
const userSchema = new mongoose.Schema({
    email:String,
    password : String
})

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/register",(req,res)=>{
    res.render("register")
});
app.get("/login",(req,res)=>{
    res.render("login")
});
app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login")
    }
})
app.get("/logout",(req,res)=>{
    req.logOut((err)=>{
        if(!err){
            res.redirect("/");
        }
    })
})



app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,((err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets")
            })
        }
    }))

    
})
app.post('/login', passport.authenticate('local', { failureRedirect: '/' }),  function(req, res) {
	
	res.redirect('/secrets');
});



app.listen(3000,(req,res)=>{
    console.log("started on port 3000");
})