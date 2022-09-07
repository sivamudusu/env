//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs")
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");






const app = express();
app.use(express.static("public"));
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
const secretShema = new mongoose.Schema({
  secret:String,
  created: Date
})
const Secret = new mongoose.model("Secret",secretShema);


const userSchema = new mongoose.Schema({
    email:String,
    password : String,
    googleId:String,
    facebookId:String,
    secrets:[{type:String}]
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
});
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback:true
  },
  function(request,accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID : process.env.FACEBOOK_APP_ID,
    clientSecret : process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user); 
    });
  }
));


app.get("/",(req,res)=>{
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] })
);
app.get("/auth/facebook",
 passport.authenticate("facebook",{scope:["profile"]}));

app.get('/auth/facebook/secrets',
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get("/register",(req,res)=>{
    res.render("register")
});
app.get("/login",(req,res)=>{
    res.render("login")
});
app.get("/secrets",(req,res)=>{
  Secret.find({},(err,foundSecrets)=>{
    if(err){
      console.log(err);
    }else{
      if(foundSecrets){
        res.render("secrets",{secrets:foundSecrets})
      }
    }
  })


   
})
app.get("/logout",(req,res)=>{
    req.logOut((err)=>{
        if(!err){
            res.redirect("/");
        }
    })
})
app.get("/submit",(req,res)=>{
  if (req.isAuthenticated()){
    res.render("submit")
  }else{
    res.redirect("/login");
  }
})
app.post("/submit",(req,res)=>{
  const submittedSecret = new Secret({
    secret:req.body.secret,
    created:new Date()
  })
  submittedSecret.save();

  User.findById(req.user.id,(err,foundUser)=>{
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secrets.push(submittedSecret)
        foundUser.save((err)=>{
          if(!err){
            res.redirect("/secrets")

          }
        })
        
      }
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