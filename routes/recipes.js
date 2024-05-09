const express = require ('express')
const router = express.Router();
  const User = require('../models/user');
  const { isLoggedIn, isAuthor,  isReviewAuthor } = require('../middleware');
  const Review = require('../models/review');
  const Recipe = require('../models/recipes');
  const recipes= require('../controllers/recipes');
  router.route('/')
    .get(recipes.getRecipes)
    .post(isLoggedIn, recipes.createRecipe)


router.get('/new', isLoggedIn, recipes.renderNewForm)

router.route('/:id')
    .get(recipes.showRecipe)
    .put(isLoggedIn, isAuthor,recipes.updateRecipe)
    .delete(isLoggedIn, isAuthor, recipes.deleteRecipe);

router.get('/:id/edit', isLoggedIn, isAuthor,  recipes.renderEditForm)



module.exports = router;
