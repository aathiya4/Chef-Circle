const express = require ('express')
const app = express()
const path= require('path')
const ejsMate = require('ejs-mate')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Recipe = require('./models/recipes');
const { isLoggedIn, isAuthor, validateRecipe, isReviewAuthor } = require('./middleware');
const Review = require('./models/review');
const fetchNutritionalData = require('./apicode');
const axios = require('axios');


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/recipe-app');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

app.engine('ejs',ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';


const sessionConfig = {
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.get('/register',(req,res)=>{
    res.render('register.ejs')
})

app.post('/register', async(req,res)=>{
    try{
    const { email, username, password } = req.body;
    const user = new User({ email, username});
    const registeredUser = await User.register( user, password) ;
    req.session.user_id=user._id;
    req.session.username=user.username;
    req.login(registeredUser, err => {
        if(err) return next(err);
        req.flash('success','Welcome to ChefCircle!');
        res.redirect('/recipes');
    })}
    catch(e){
    req.flash('error', e.message);
    res.redirect('/register');}
})

app.get('/recipes/new',isLoggedIn, (req,res)=>{
    res.render('new.ejs')
})

app.post('/recipes', isLoggedIn, async (req, res) => {
  console.log(req.body.recipe);
const newRecipe = new Recipe({
      title: req.body.title,
      cuisine: req.body.cuisine,
      description: req.body.description,
      ingredients: req.body.ingredients.split('\r\n'),
      instructions: req.body.instructions.split('\r\n'),
      cookTime: req.body.cookTime,
      difficulty: req.body.difficulty,
      createdBy: req.session.user_id
  });

  try {
      const savedRecipe = await newRecipe.save();
      console.log(savedRecipe);
      console.log(req.body);
      const userid=req.session.user_id;
      const user = await User.findById(userid);

        // Push the ID of the newly created recipe to the user's createdRecipes array
        user.createdRecipes.push(savedRecipe._id);

        // Save the user document to update the changes
        await user.save();

        console.log(req.body);

      res.redirect(`/recipes/${savedRecipe._id}`);

  } catch (error) {
      console.error(error);
      req.flash('error', 'An error occurred while creating the recipe.');
      res.redirect('/recipes');
  }
});



  

app.get('/login', (req,res)=>{
   res.render('login.ejs');
});

app.post('/login',passport.authenticate('local', {failureFlash:true, failureRedirect: '/login' }), async(req,res)=>{
    req.flash('success','welcome back');
    console.log(req.session);
    const redirectUrl = req.session.returnTo || '/recipes';
    console.log(redirectUrl);
    // console.log(req);
    delete req.session.returnTo;
    const{username, password}=req.body;
    const foundUser= await User.findOne({username:username});
    req.session.user_id=foundUser._id;
    req.session.username=foundUser.username;
    res.redirect(redirectUrl);
})


app.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.log("Error while logging out:", err);
      }
      req.flash('success', "Goodbye!");
      res.redirect('/recipes');
    });
  });
  

app.get('/recipes', async(req,res)=>{
    const recipes = await Recipe.find({});
    res.render('recipes.ejs',{recipes});
})


app.get('/recipes/:id', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  
  const userid=req.session.user_id;
 
      // Fetch the recipe details from MongoDB
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

      res.render('show.ejs', { recipe, user });
})






app.delete('/recipes/:id',isLoggedIn, isAuthor, async(req,res)=>{
   const{id}=req.params;
   console.log(req.params);
   const deletedRecipe = await Recipe.findByIdAndDelete(id);
   res.redirect('/recipes');
 })

 app.get('/recipes/:id/edit',isLoggedIn, isAuthor, async(req,res)=>{
    const{id}=req.params;
    console.log(req.params);
    const recipe = await Recipe.findById(id);
    res.render('edit.ejs',{recipe})
 })

 app.put('/recipes/:id',isLoggedIn, isAuthor,  async (req, res) => {
    const { id } = req.params;
    try {
      console.log( req.body.recipe);
      
      const updated_recipe = { title: req.body.recipe.title,
      cuisine: req.body.recipe.cuisine,
      ingredients: req.body.recipe.ingredients.split('\r\n'),
      instructions: req.body.recipe.instructions.split('\r\n'),
      cookTime: req.body.recipe.cookTime,
      difficulty: req.body.recipe.difficulty };
        // Save the updated recipe
      const updatedRecipe = await Recipe.findOneAndUpdate(
        {_id:id},
        updated_recipe,
            // req.body.recipe ,
        { runValidators: true, new: true, upsert:true }
      );
      console.log(updatedRecipe);
      console.log(req.body);
      if (!updatedRecipe) {
        // If findByIdAndUpdate returns null, it means the document with the given id was not found
        console.log("Recipe not found or not updated.");}
      // Redirect to the recipe's show page after successful update
      res.redirect(`/recipes/${updatedRecipe._id}`);
    } catch (err) {
      console.log("Error updating recipe:", err);
      // Handle any errors that occurred during the update process
      // For example, you could redirect back to the edit page with an error message
      req.flash('error', 'Failed to update the recipe');
      res.redirect(`/recipes/${id}/edit`);
    }
  });
  


const stringSimilarity = require('string-similarity');
const natural = require('natural');
const { DiffieHellmanGroup } = require('crypto');

// ... Other configurations and routes ...

// Search route
app.get('/search', async (req, res) => {
    try {
      const { query, cuisine, difficulty } = req.query;
      let filter = {};
  
      if (query) {
        // If a query string is provided, perform a fuzzy search on title
        const suggestedTitle = await getSuggestedTitle(query);
        if (suggestedTitle) {
          filter.title = { $regex: new RegExp(suggestedTitle, 'i') };
        } else {
          filter.title = { $regex: new RegExp(query, 'i') };
        }
      }
  
      if (cuisine && cuisine !== 'Choose Cuisine...') {
        // Perform a fuzzy search on cuisine
        const suggestedCuisine = await getSuggestedCuisine(cuisine);
        if (suggestedCuisine) {
          filter.cuisine = { $regex: new RegExp(suggestedCuisine, 'i') };
        } else {
          filter.cuisine = { $regex: new RegExp(cuisine, 'i') };
        }
      }
  
      if (difficulty && difficulty !== 'Choose Difficulty...') {
        // If a difficulty is selected, filter by difficulty
        filter.difficulty = difficulty;
      }
  
      const recipes = await Recipe.find(filter);
      res.render('search.ejs', { recipes, query, cuisine, difficulty });
    } catch (err) {
      res.status(500).send('Error searching for recipes.');
    }
  });
  
  // Helper function to get suggested title
  async function getSuggestedTitle(title) {
    const titles = await getUniqueTitles(); // Fetch unique titles from the database
    const matches = stringSimilarity.findBestMatch(title, titles);
    const bestMatch = matches.bestMatch.target;
    const similarity = matches.bestMatch.rating;
  
    // Threshold for similarity can be adjusted as needed
    // Here, I'm using a threshold of 0.6, meaning at least 60% similarity is required for suggestion
    if (similarity >= 0.2) {
      const spellcheck = new natural.Spellcheck(titles);
      const suggestedTitle = spellcheck.getCorrections(bestMatch, 1)[0];
      return suggestedTitle || bestMatch;
    } else {
      return null;
    }
  }
  
  // Helper function to get suggested cuisine
  async function getSuggestedCuisine(cuisine) {
    const cuisines = await getUniqueCuisines(); // Fetch unique cuisines from the database
    const matches = stringSimilarity.findBestMatch(cuisine, cuisines);
    const bestMatch = matches.bestMatch.target;
    const similarity = matches.bestMatch.rating;
  
    // Threshold for similarity can be adjusted as needed
    // Here, I'm using a threshold of 0.6, meaning at least 60% similarity is required for suggestion
    if (similarity >= 0.2) {
      const spellcheck = new natural.Spellcheck(cuisines);
      const suggestedCuisine = spellcheck.getCorrections(bestMatch, 1)[0];
      return suggestedCuisine || bestMatch;
    } else {
      return null;
    }
  }
  
  // Helper function to fetch unique titles from the database
  async function getUniqueTitles() {
    const titles = await Recipe.distinct('title', {}).exec(); // Fetch unique titles from the database
    return titles;
  }
  
  // Helper function to fetch unique cuisines from the database
  async function getUniqueCuisines() {
    const cuisines = await Recipe.distinct('cuisine', {}).exec(); // Fetch unique cuisines from the database
    return cuisines;
  }
  



  
  
  app.get('/', async (req, res) => {
    const recipes = await Recipe.find({});
    res.render('home.ejs', { recipes });
  });

  app.get('/api/cuisines', async (req, res) => {
    try {
      const cuisines = await Recipe.distinct('cuisine');
      res.json(cuisines);
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // API endpoint to fetch titles for autocomplete
  app.get('/api/titles', async (req, res) => {
    try {
      const titles = await Recipe.distinct('title');
      res.json(titles);
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.post('/recipes/:id/reviews', isLoggedIn, async(req,res)=>{
    const recipe = await Recipe.findById(req.params.id);
    console.log(req);
    // const review = new Review(req.body.review);
    const review = new Review({ body:req.body.review.body, rating:req.body.review.rating, author:req.session.user_id});
    // review.author = req.session.user._id;
    recipe.reviews.push(review);
    await review.save();
    await recipe.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/recipes/${recipe._id}`);
 
})
app.delete('/recipes/:id/reviews/:reviewId',isLoggedIn, isReviewAuthor, async (req, res) => {
  const { id, reviewId } = req.params;
  await Recipe.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash('success', 'Successfully deleted review')
  res.redirect(`/recipes/${id}`);
})






app.post('/nutrition/:id', async (req, res) => {
  const appId = '3782178f';
  const appKey = '618881cbbaf25ea4d83a514fb693eff7';
  const apiUrl = 'https://api.edamam.com/api/nutrition-details';

  try {
    // Find the recipe by ID in your database
    const recipe = await Recipe.findById(req.params.id);

    // Extract the ingredients from the recipe
    const requestBody = {
      title: recipe.title,
      ingr: recipe.ingredients
    };

    // Make the API call to get the nutrition details
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

    // Send the response data to the nutrition.ejs template
    res.render('nutrition.ejs', {recipeId: req.params.id, nutritionData: response.data });
    console.log(response.data);

  } catch (error) {
    res.render('nutritionerror.ejs', { recipeId: req.params.id });
    };
  
});



// User profile page
app.get('/profile/:id', async (req, res) => {
  
    // Fetch the user's data, including createdRecipes
    const user = await User.findById(req.params.id)
        .populate('favoriteRecipes')
        .populate({
            path: 'createdRecipes',
            populate: {
                path: 'reviews',
                populate: {
                    path: 'author'
                }
            }
        });
        console.log('user.createdRecipes:', user.createdRecipes);
    res.render('profile.ejs', { user });

});

// Save a recipe to favorites
app.post('/profile/:id/favorite/:recipeId', async (req, res) => {
    
        const user = await User.findById(req.params.id);
        user.favoriteRecipes.push(req.params.recipeId);
        await user.save();
        console.log(user);
        res.redirect(`/profile/${user._id}`);
    
});

app.post('/profile/:userId/unfavorite/:recipeId', isLoggedIn, async (req, res) => {
  const { userId, recipeId } = req.params;

  try {
      // Fetch the user by userId
      const user = await User.findById(userId);

      // Find the index of the recipe in favoriteRecipes array
      const recipeIndex = user.favoriteRecipes.indexOf(recipeId);

      if (recipeIndex !== -1) {
          // Remove the recipe from favoriteRecipes
          user.favoriteRecipes.splice(recipeIndex, 1);
          await user.save();
      }

      res.redirect(`/recipes/${recipeId}`);
  } catch (error) {
      req.flash('error', 'An error occurred while removing from favorites.');
      res.redirect(`/recipes/${recipeId}`);
  }
});

// // Add a review to a recipe
// app.post('/review/:recipeId', async (req, res) => {
//     try {
//         const { rating, comment } = req.body;
//         const review = new Review({
//             recipe: req.params.recipeId,
//             user: req.user._id,
//             rating,
//             comment,
//         });
//         await review.save();
//         res.redirect('/profile');
//     } catch (error) {
//         res.status(500).json({ error: 'An error occurred' });
//     }
// });

app.listen(3000,()=>{
  console.log("Listening on port 3000")
})

