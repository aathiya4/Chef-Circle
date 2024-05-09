  const User = require('../models/user');
  const mongoose = require('mongoose');
  const Recipe = require('../models/recipes');
  const Review = require('../models/review');
  const axios = require('axios');

module.exports.renderNewForm= (req,res)=>{
    res.render('new.ejs')
}


module.exports.createRecipe= async (req, res) => {
  console.log(req.body);
  const newRecipe = new Recipe({
      title: req.body.title,
      cuisine: req.body.cuisine,
      description: req.body.description,
      ingredients: req.body.ingredients.split('\r\n'),
      instructions: req.body.instructions.split('\r\n'),
      cookTime: req.body.cookTime,
      difficulty: req.body.difficulty,
      createdBy: req.session.user_id || req.session.passport.user
      
  });

  try {
      
      const apiUrl = 'https://api.edamam.com/api/nutrition-details';
      const appId = '3782178f';
      const appKey = '618881cbbaf25ea4d83a514fb693eff7';

      const requestBody = {
          title: req.body.title,
          ingr: req.body.ingredients.split('\r\n')
      };

      const response = await axios.post(apiUrl, requestBody, {
          headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
          },
          params: {
              app_id: appId,
              app_key: appKey
          }
      });

      const mealType = response.data.mealType;
      const dishType = response.data.dishType;
      const calories = response.data.calories;

      newRecipe.mealType = mealType;
      newRecipe.dishType = dishType;
      newRecipe.calories = calories;

      const savedRecipe = await newRecipe.save();

      const userid = req.session.user_id || req.session.passport.user ;
      const user = await User.findById(userid);
      user.createdRecipes.push(savedRecipe._id);
      await user.save();

      res.redirect(`/recipes/${savedRecipe._id}`);
  } catch (error) {
      console.error(error);
      req.flash('error', 'An error occurred while creating the recipe.');
      res.redirect('/recipes');
  }
};


module.exports.getRecipes=async(req,res)=>{
    const recipes = await Recipe.find({});
    res.render('recipes.ejs',{recipes});
}


module.exports.showRecipe= async (req, res) => {
  const { id } = req.params;
  
  const userid=req.session.user_id || req.session.passport.user;
  console.log(req.session); 
      const recipe = await Recipe.findById(id).populate({
          path: 'reviews',
          populate: {
              path: 'author'
          }
      }).populate('createdBy');

      if (!recipe) {
          req.flash('error', 'Cannot find that recipe!');
          return res.redirect('/recipes');
      }
      const user = await User.findById(userid);
      console.log(user);
      console.log(userid);

      res.render('show.ejs', { recipe, user });
}

module.exports.deleteRecipe=  async(req,res)=>{
   const{id}=req.params;
   console.log(req.params);
   const deletedRecipe = await Recipe.findByIdAndDelete(id);
   res.redirect('/recipes');
 }

 module.exports.renderEditForm= async(req,res)=>{
    const{id}=req.params;
    console.log(req.params);
    const recipe = await Recipe.findById(id);
    res.render('edit.ejs',{recipe})
 }

 module.exports.updateRecipe= async (req, res) => {
    const { id } = req.params;
    try {
      console.log( req.body.recipe);
      
      const updated_recipe = { title: req.body.recipe.title,
      cuisine: req.body.recipe.cuisine,
      ingredients: req.body.recipe.ingredients.split('\r\n'),
      instructions: req.body.recipe.instructions.split('\r\n'),
      cookTime: req.body.recipe.cookTime,
      difficulty: req.body.recipe.difficulty };
      const updatedRecipe = await Recipe.findOneAndUpdate(
        {_id:id},
        updated_recipe,
        { runValidators: true, new: true, upsert:true }
      );
      console.log(updatedRecipe);
      console.log(req.body);
      if (!updatedRecipe) {
        console.log("Recipe not found or not updated.");}
      res.redirect(`/recipes/${updatedRecipe._id}`);
    } catch (err) {
      console.log("Error updating recipe:", err);
      req.flash('error', 'Failed to update the recipe');
      res.redirect(`/recipes/${id}/edit`);
    }
  };
  