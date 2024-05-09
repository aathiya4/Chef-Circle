const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const UserSchema = new Schema({
    googleProvider: {
        id: String,
        displayName: String
      },
    username: String,
    email: String,
    password: String,
    favoriteRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    createdRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],

});
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);