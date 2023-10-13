var express = require('express');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
const mongoose = require('mongoose');
const User= require('./models/user');
main().catch(err => console.log(err));
// Connect to MongoDB
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/recipe-app');
  
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  }

const db = mongoose.connection;

// Export the database connection object
module.exports = db;
require('dotenv').config()

var router = express.Router();

// passport.use(new GoogleStrategy({
//     clientID: process.env['GOOGLE_CLIENT_ID'],
//     clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
//     callbackURL: '/oauth2/redirect/google',
//     scope: [ 'profile' ]
//   }, function verify(issuer, profile, cb) {
//     db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
//       issuer,
//       profile.id
//     ], function(err, row) {
//       if (err) { return cb(err); }
//       if (!row) {
//         db.run('INSERT INTO users (name) VALUES (?)', [
//           profile.displayName
//         ], function(err) {
//           if (err) { return cb(err); }
  
//           var id = this.lastID;
//           db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
//             id,
//             issuer,
//             profile.id
//           ], function(err) {
//             if (err) { return cb(err); }
//             var user = {
//               id: id,
//               name: profile.displayName
//             };
//             return cb(null, user);
//           });
//         });
//       } else {
//         db.get('SELECT * FROM users WHERE id = ?', [ row.user_id ], function(err, row) {
//           if (err) { return cb(err); }
//           if (!row) { return cb(null, false); }
//           return cb(null, row);
//         });
//       }
//     });
//   }));
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
  

//   passport.serializeUser(function(user, cb) {
//     process.nextTick(function() {
//       cb(null, { id: user.id, username: user.username, name: user.name });
//     });
//   });
  
//   passport.deserializeUser(function(user, cb) {
//     process.nextTick(function() {
//       return cb(null, user);
//     });
//   });

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
  
// router.get('/login', function(req, res, next) {
//   res.render('login');
// });
// router.get('/login/federated/google', passport.authenticate('google'));
// router.get('/oauth2/redirect/google', passport.authenticate('google', {
//     successRedirect: '/',
//     failureRedirect: '/login'
//   }));
router.get('/login/federated/google', passport.authenticate('google', { scope: ['openid', 'profile'] }));
router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

module.exports = router;