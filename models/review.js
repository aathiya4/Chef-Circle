const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const reviewSchema = new Schema({
//     body: String,
//     rating: Number,
//     author: {
//         type: Schema.Types.ObjectId,
//         ref: 'User'
//     }
// });

const reviewSchema = new Schema({
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    body: String,
    // ... other fields
});

module.exports = mongoose.model("Review", reviewSchema);