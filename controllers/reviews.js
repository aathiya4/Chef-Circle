const User = require('../models/user');
  const mongoose = require('mongoose');
  const Recipe = require('../models/recipes');
  const Review = require('../models/review');

  module.exports.reviewRecipe= async(req,res)=>{
    const recipe = await Recipe.findById(req.params.id);
    console.log(req);
    const review = new Review({ body:req.body.review.body, rating:req.body.review.rating, author:req.session.user_id || req.session.passport.user});
    recipe.reviews.push(review);
    await review.save();
    await recipe.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/recipes/${recipe._id}`);
 
}

module.exports.deleteReview= async (req, res) => {
  const { id, reviewId } = req.params;
  await Recipe.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash('success', 'Successfully deleted review')
  res.redirect(`/recipes/${id}`);
}



