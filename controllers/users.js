const User = require('../models/user');
  const mongoose = require('mongoose');
  const Recipe = require('../models/recipes');
  const Review = require('../models/review');

module.exports.renderRegisterForm= (req,res)=>{
    res.render('register.ejs')
}

module.exports.register= async(req,res)=>{
    try{
    const { email, username, password } = req.body;
    const user = new User({ email, username});
    const registeredUser = await User.register( user, password) ;
    req.session.user_id=user._id;
    req.session.username=user.username;
    req.login(registeredUser, err => {
        if(err) return next(err);
        req.flash('success','Welcome to ChefCircle!');
        res.redirect('/recipes');
    })}
    catch(e){
    req.flash('error', e.message);
    res.redirect('/register');}
}


module.exports.renderLoginForm= (req,res)=>{
    res.render('login.ejs');
 };
 
 module.exports.login= async(req,res)=>{
     req.flash('success','welcome back');
     console.log(req.session);
     const redirectUrl = req.session.returnTo || '/recipes';
     console.log(redirectUrl);
     delete req.session.returnTo;
     const{username, password}=req.body;
     const foundUser= await User.findOne({username:username});
     req.session.user_id=foundUser._id;
     req.session.username=foundUser.username;
     res.redirect(redirectUrl);
 }
 
 
 module.exports.logout=(req, res) => {
     req.logout((err) => {
       if (err) {
         console.log("Error while logging out:", err);
       }
       req.flash('success', "Goodbye!");
       res.redirect('/recipes');
     });
   };
 