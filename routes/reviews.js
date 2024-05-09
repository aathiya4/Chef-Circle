const express = require ('express')
const router = express.Router({ mergeParams: true });
  const User = require('../models/user');
  const { isLoggedIn, isAuthor,  isReviewAuthor } = require('../middleware');
  const Review = require('../models/review');
  const Recipe = require('../models/recipes');
  const reviews= require('../controllers/reviews');

  router.post('/', isLoggedIn, reviews.reviewRecipe)

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, reviews.deleteReview)

module.exports = router;