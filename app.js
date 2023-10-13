if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

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
// const { cloudinary } = require('./cloudinary');
// const multer = require('multer');
// const { storage } = require('./cloudinary');
// const upload = multer({ storage });
const multer = require('multer');

const cloudinary = require('cloudinary').v2;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// var indexRouter = require('./routes/index');
var authRouter = require('./auth');
var morgan = require('morgan');
const MongoDBStore = require('connect-mongodb-session')(session);



// var SQLiteStore = require('connect-sqlite3')(session);



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

const store = new MongoDBStore({
  uri: 'mongodb://127.0.0.1:27017/recipe-app', // Replace with your MongoDB connection URI
  collection: 'sessions' // Collection name for storing sessions
});

store.on('error', (error) => {
  console.error('MongoDB session store error:', error);
});

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
    },
    store: store 
   
}

app.use(session(sessionConfig));
// app.use(passport.authenticate('session'));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});


app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    console.log(req.user);
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
app.use('/', authRouter);

app.get('/uploadform', (req, res) => {
  res.render('uploadForm'); // Create the corresponding EJS view file
});

// app.post('/upload', upload.single('image'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No image file provided' });}
//     const result = await cloudinary.uploader.upload(req.file.buffer);
//     res.render('upload', { imageUrl: result.secure_url }); 
 
// });

app.post('/upload', upload.single('image'),  async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const CLOUD_NAME= process.env.CLOUDINARY_CLOUD_NAME;
  const API_KEY= process.env.CLOUDINARY_KEY;
  const API_SECRET= process.env.CLOUDINARY_SECRET;
  console.log(req);
  const file = req.file.buffer; // Replace with how you handle file upload in your app
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = require('crypto').createHash('sha1').update(`timestamp=${timestamp}${API_SECRET}`).digest('hex');

  try {
    const response = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, null, {
      params: {
        file,
        timestamp,
        api_key: API_KEY,
        signature
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response.status).json(error.response.data);
  }
});

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

app.get('/about',(req,res)=>{
  res.render('about.ejs');
})

app.get('/contact',(req,res)=>{
  res.render('contact.ejs');
})

app.get('/recipes/new',isLoggedIn, (req,res)=>{
    res.render('new.ejs')
})


app.post('/recipes', isLoggedIn,  async (req, res) => {
  // const result = await cloudinary.uploader.upload(req.file.buffer);
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
      // imageUrl : { imageUrl: result.secure_url }
  });

  try {
      // Make the API call to get nutrition details
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

      // Extract mealType, dishType, and calories from API response
      const mealType = response.data.mealType;
      const dishType = response.data.dishType;
      const calories = response.data.calories;

      // Add the extracted values to the newRecipe object
      newRecipe.mealType = mealType;
      newRecipe.dishType = dishType;
      newRecipe.calories = calories;

      // Save the new recipe
      const savedRecipe = await newRecipe.save();

      // Update the user's createdRecipes array
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
});



  

app.get('/login', (req,res)=>{
   res.render('login.ejs');
});

app.post('/login',passport.authenticate('local', {failureFlash:true, failureRedirect: '/login' }), async(req,res)=>{
    req.flash('success','welcome back');
    console.log(req.session);
    const redirectUrl = req.session.returnTo || '/recipes';
    console.log(redirectUrl);
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
  
  const userid=req.session.user_id || req.session.passport.user;
  console.log(req.session); 
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
      console.log(user);
      console.log(userid);

      res.render('show.ejs', { recipe, user });
})






app.delete('/recipes/:id',isLoggedIn,  async(req,res)=>{
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


app.get('/search', async (req, res) => {
 
      const { query, cuisine, difficulty, mealType, dishType } = req.query;
      let filter = {};
      console.log(req.query)

      if (query) {
          const suggestedTitle = await getSuggestedTitle(query);
          if (suggestedTitle) {
              filter.title = { $regex: new RegExp(suggestedTitle, 'i') };
          } else {
              filter.title = { $regex: new RegExp(query, 'i') };
          }
      }

      if (cuisine && cuisine !== 'Choose Cuisine...') {
          const suggestedCuisine = await getSuggestedCuisine(cuisine);
          if (suggestedCuisine) {
              filter.cuisine = { $regex: new RegExp(suggestedCuisine, 'i') };
          } else {
              filter.cuisine = { $regex: new RegExp(cuisine, 'i') };
          }
      }

      if (difficulty && difficulty !== 'Choose Difficulty...') {
          filter.difficulty = difficulty;
      }

      if (mealType && mealType !== 'Choose Meal Type...') {
        filter.mealType = mealType; // No need to wrap in an array
      }

      if (dishType && dishType !== 'Choose Dish Type...') {
        filter.dishType = dishType; // No need to wrap in an array
      }

    

    const recipes = await Recipe.find(filter);
     console.log(recipes)
      res.render('search.ejs', { recipes, query, cuisine, difficulty, mealType, dishType });

  
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

  async function getSuggestedTitle(mealType) {
    const mealtypes= await getUniqueMealtypes(); // Fetch unique titles from the database
    const matches = stringSimilarity.findBestMatch(mealType, mealtypes);
    const bestMatch = matches.bestMatch.target;
    const similarity = matches.bestMatch.rating;
  
    // Threshold for similarity can be adjusted as needed
    // Here, I'm using a threshold of 0.6, meaning at least 60% similarity is required for suggestion
    if (similarity >= 0.2) {
      const spellcheck = new natural.Spellcheck(mealtypes);
      const suggestedmealtype = spellcheck.getCorrections(bestMatch, 1)[0];
      return suggestedmealtype || bestMatch;
    } else {
      return null;
    }
  }

  async function getUniqueMealtypes() {
    const mealtypes = await Recipe.distinct('mealType', {}).exec(); // Fetch unique titles from the database
    return mealtypes;
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
    const review = new Review({ body:req.body.review.body, rating:req.body.review.rating, author:req.session.user_id || req.session.passport.user});
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
        res.redirect(`/recipes/${req.params.recipeId}`);
    
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

const apiKey = '20e957bcc5b848a4b124d5c79db028d3';

// Define the route to render the meal plan form
app.get('/mealplan',isLoggedIn, (req, res) => {
  res.render('mealplan');
});

// Define the route to handle form submission and render the meal plan page
app.post('/mealplan', isLoggedIn, async (req, res) => {
  const calories = req.body.calories;
  const dietType = req.body.dietType;
  
  try {
    const response = await axios.get(`https://api.spoonacular.com/mealplanner/generate?timeFrame=week&targetCalories=${calories}&diet=${dietType}&apiKey=${apiKey}`);
    
    // Pass the meal plan data to the EJS template
    res.render('mealplandata', { mealPlan: response.data });
  } catch (error) {
    console.error(error);
    res.render('mealplandata', { mealPlan: null }); // Render with no data in case of an error
  }
});





// // Make the API request to Spoonacular with the API key included
// axios.get(apiUrl, {
//   params: {
//     apiKey: apiKey,
//     // Add any other necessary parameters
//   }
// })
//   .then(response => {
//     const mealPlan = response.data;
//     // Pass mealPlan to your EJS template for rendering
//     // res.render('mealPlan.ejs', { mealPlan });
//   })
//   .catch(error => {
//     console.error('Error fetching meal plan:', error);
//     res.status(500).send('Error fetching meal plan');
//   });



// const apiKey = '20e957bcc5b848a4b124d5c79db028d3';

// // Define a route to fetch a meal plan
// app.get('/meal-plan', async (req, res) => {
//   try {
//     // Fetch recipes from your database based on calories
//     const minCalories = 150; // Define your minimum calories
//     const maxCalories = 8000; // Define your maximum calories

//     const recipesFromDatabase = await Recipe.find({
//       calories: { $gte: minCalories, $lte: maxCalories }
//     }, 'title servings sourceUrl');

//     // Call the Spoonacular API with your API key
//     const apiUrl = `https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}&timeFrame=week&targetCalories=2000&diet=none`;

//     const response = await axios.get(apiUrl);
//     const mealPlan = response.data;

//     // Replace the meal information with your own recipes based on calories
//     Object.keys(mealPlan.week).forEach(day => {
//       mealPlan.week[day].meals = recipesFromDatabase.filter(recipe =>
//         recipe.calories >= minCalories && recipe.calories <= maxCalories
//       );
//     });

//     // Render the mealPlan using an EJS template
//     res.render('mplan.ejs', { mealPlan: mealPlan.week });

//   } catch (error) {
//     console.error('Error fetching meal plan:', error);
//     res.status(500).send('Error fetching meal plan');
//   }
// });





app.listen(3000,()=>{
  console.log("Listening on port 3000")
})

