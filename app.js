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
const { isLoggedIn, isAuthor,  isReviewAuthor } = require('./middleware');
const Review = require('./models/review');
const fetchNutritionalData = require('./apicode');
const axios = require('axios');
const recipeRoutes = require('./routes/recipes');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var authRouter = require('./auth');
var morgan = require('morgan');
const MongoDBStore = require('connect-mongodb-session')(session);



main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/recipe-app');

}


app.engine('ejs',ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const store = new MongoDBStore({
  uri: 'mongodb://127.0.0.1:27017/recipe-app', 
  collection: 'sessions' 
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
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    store: store 
   
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
    console.log(req.user);
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
app.use('/', authRouter);

app.get('/about',(req,res)=>{
  res.render('about.ejs');
})

app.get('/contact',(req,res)=>{
  res.render('contact.ejs');
})

app.use('/', userRoutes);
app.use('/recipes', recipeRoutes)
app.use('/recipes/:id/reviews', reviewRoutes)

const stringSimilarity = require('string-similarity');
const natural = require('natural');
const { DiffieHellmanGroup } = require('crypto');


//SEARCH AND AUTOCOMPLETE ROUTES
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
        filter.mealType = mealType; 
      }


    const recipes = await Recipe.find(filter);
     console.log(recipes)
      res.render('search.ejs', { recipes, query, cuisine, difficulty, mealType, dishType });

  
});

  
  // Helper function to get suggested titles
  async function getSuggestedTitle(title) {
    const titles = await getUniqueTitles(); 
    const matches = stringSimilarity.findBestMatch(title, titles);
    const bestMatch = matches.bestMatch.target;
    const similarity = matches.bestMatch.rating;
  
    if (similarity >= 0.2) {
      const spellcheck = new natural.Spellcheck(titles);
      const suggestedTitle = spellcheck.getCorrections(bestMatch, 1)[0];
      return suggestedTitle || bestMatch;
    } else {
      return null;
    }
  }
  
  // Helper function to get suggested cuisines
  async function getSuggestedCuisine(cuisine) {
    const cuisines = await getUniqueCuisines(); 
    const matches = stringSimilarity.findBestMatch(cuisine, cuisines);
    const bestMatch = matches.bestMatch.target;
    const similarity = matches.bestMatch.rating;
  
    if (similarity >= 0.2) {
      const spellcheck = new natural.Spellcheck(cuisines);
      const suggestedCuisine = spellcheck.getCorrections(bestMatch, 1)[0];
      return suggestedCuisine || bestMatch;
    } else {
      return null;
    }
  }

  async function getSuggestedTitle(mealType) {
    const mealtypes= await getUniqueMealtypes(); 
    const matches = stringSimilarity.findBestMatch(mealType, mealtypes);
    const bestMatch = matches.bestMatch.target;
    const similarity = matches.bestMatch.rating;

    if (similarity >= 0.2) {
      const spellcheck = new natural.Spellcheck(mealtypes);
      const suggestedmealtype = spellcheck.getCorrections(bestMatch, 1)[0];
      return suggestedmealtype || bestMatch;
    } else {
      return null;
    }
  }

  async function getUniqueMealtypes() {
    const mealtypes = await Recipe.distinct('mealType', {}).exec(); 
    return mealtypes;
  }
  
  // Helper function to fetch unique titles from the database
  async function getUniqueTitles() {
    const titles = await Recipe.distinct('title', {}).exec(); 
    return titles;
  }
  
  // Helper function to fetch unique cuisines from the database
  async function getUniqueCuisines() {
    const cuisines = await Recipe.distinct('cuisine', {}).exec(); 
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



//ROUTES TO FETCH NUTRITIONAL DETAILS
app.post('/nutrition/:id', async (req, res) => {
  const appId = '3782178f';
  const appKey = '618881cbbaf25ea4d83a514fb693eff7';
  const apiUrl = 'https://api.edamam.com/api/nutrition-details';

  try {
    
    const recipe = await Recipe.findById(req.params.id);

    const requestBody = {
      title: recipe.title,
      ingr: recipe.ingredients
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

    res.render('nutrition.ejs', {recipeId: req.params.id, nutritionData: response.data });
    console.log(response.data);

  } catch (error) {
    res.render('nutritionerror.ejs', { recipeId: req.params.id });
    };
  
});



// USER PROFILE ROUTES
app.get('/profile/:id', async (req, res) => {
  
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
      
      const user = await User.findById(userId);

      const recipeIndex = user.favoriteRecipes.indexOf(recipeId);

      if (recipeIndex !== -1) {
          user.favoriteRecipes.splice(recipeIndex, 1);
          await user.save();
      }

      res.redirect(`/recipes/${recipeId}`);
  } catch (error) {
      req.flash('error', 'An error occurred while removing from favorites.');
      res.redirect(`/recipes/${recipeId}`);
  }
});


//MEAL PLANNING ROUTES
const apiKey = '20e957bcc5b848a4b124d5c79db028d3';

app.get('/mealplan',isLoggedIn, (req, res) => {
  res.render('mealplan');
});

app.post('/mealplan', isLoggedIn, async (req, res) => {
  const calories = req.body.calories;
  const dietType = req.body.dietType;
  
  try {
    const response = await axios.get(`https://api.spoonacular.com/mealplanner/generate?timeFrame=week&targetCalories=${calories}&diet=${dietType}&apiKey=${apiKey}`);
  
    res.render('mealplandata', { mealPlan: response.data });
  } catch (error) {
    console.error(error);
    res.render('mealplandata', { mealPlan: null }); 
  }
});


app.listen(3000,()=>{
  console.log("Listening on port 3000")
})

