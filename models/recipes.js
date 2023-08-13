const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  ingredients: {
    type: [String],
    required: true,
  },
  instructions: {
    type: [String],
    required: true,
  },
  cookTime: {
    type: Number,
    required: true,
  },
  cuisine: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviews: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }
] 
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
