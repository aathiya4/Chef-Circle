const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const reviewSchema = new Schema({
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    body: String,
});

module.exports = mongoose.model("Review", reviewSchema);