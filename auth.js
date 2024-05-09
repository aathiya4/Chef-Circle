var express = require('express');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
const mongoose = require('mongoose');
const User= require('./models/user');
main().catch(err => console.log(err));
// Connect to MongoDB
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/recipe-app');
  
  }

const db = mongoose.connection;

// Export the database connection object
module.exports = db;
require('dotenv').config()

var router = express.Router();

passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile']
  }, async function (issuer, profile, cb) {
    try {
      let user = await User.findOne({ 'googleProvider.id': profile.id });
  
      if (!user) {
        user = new User({
          googleProvider: {
            id: profile.id,
            displayName: profile.displayName
          }
        });
        await user.save();
      }
  
      return cb(null, user);
    } catch (error) {
      return cb(error);
    }
  }));
  


passport.serializeUser((user, cb) => {
    cb(null, user.id);
  });
  
  passport.deserializeUser(async (id, cb) => {
    try {
      const user = await User.findById(id);
      cb(null, user);
    } catch (error) {
      cb(error);
    }
  });
  

router.get('/login/federated/google', passport.authenticate('google', { scope: ['openid', 'profile'] }));
router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

module.exports = router;