const Recipe = require('../models/recipes.js'); 
const mongoose = require('mongoose');
const axios = require('axios');


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/recipe-app');

}

// const seedDB =async () => {
//    await Recipe.deleteMany({});}
//   console.log('dleted')
  const recipes = [
  {
    title: 'Classic Spaghetti Carbonara',
    description: 'A classic Italian pasta dish with creamy egg sauce and crispy pancetta.',
    ingredients: ['200g spaghetti', '2 large eggs', '100g pancetta or guanciale', '50g Pecorino Romano cheese', 'Salt and black pepper to taste'],
    instructions: [
      'Bring a large pot of salted water to a boil and cook the spaghetti until al dente.',
      'While the spaghetti cooks, whisk the eggs and cheese in a bowl, seasoning with black pepper.',
      'In a separate pan, sauté the pancetta until crispy.',
      'Drain the cooked spaghetti and add it to the pan with pancetta, tossing to coat the pasta with the pancetta fat.',
      'Remove the pan from heat, and quickly stir in the egg mixture to create a creamy sauce.',
      'Serve immediately with additional Pecorino Romano on top.'
    ],
    cookTime: 15,
    difficulty: 'Medium',
    cuisine: 'Italian',
    imageUrl: 'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/recipe-image-legacy-id-1001491_11-2e0fa5c.jpg?quality=90&webp=true&resize=375,341',
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: 'Homemade Margherita Pizza',
    description: 'A classic Margherita pizza with fresh tomatoes, mozzarella, and basil.',
    ingredients: ['100g Pizza dough', '2ml Tomato sauce', '10g Fresh mozzarella', '20g Fresh basil leaves', '1l Olive oil', 'Salt and black pepper'],
    instructions: [
      'Preheat the oven to the highest temperature (usually around 500°F or 260°C).',
      'Roll out the pizza dough on a floured surface to your desired thickness.',
      'Place the rolled-out dough on a pizza stone or a baking sheet.',
      'Spread a thin layer of tomato sauce on the dough, leaving a border around the edges.',
      'Tear the fresh mozzarella into pieces and distribute them over the sauce.',
      'Season with a pinch of salt and black pepper.',
      'Bake the pizza in the preheated oven for 8-10 minutes or until the crust is golden and the cheese is bubbly.',
      'Remove the pizza from the oven, top with fresh basil leaves, and drizzle with olive oil.',
      'Slice and serve hot.'
    ],
    cookTime: 10,
    difficulty: 'Easy',
    cuisine: 'Italian',
    imageUrl: 'https://www.vegrecipesofindia.com/wp-content/uploads/2020/12/margherita-pizza-recipe-1.jpg',
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: 'Chicken Biryani',
    description: 'A flavorful Indian rice dish with tender chicken and aromatic spices.',
    ingredients: ['2 cups basmati rice', '500g chicken, cut into pieces', '2 large onions, thinly sliced', '2 tomatoes, chopped', '1/2 cup plain yogurt', '2 tablespoons biryani masala', '1/4 teaspoon saffron strands', '1/4 cup milk', 'Ghee or vegetable oil', 'Fresh coriander and mint leaves for garnish'],
    instructions: [
      'Wash the basmati rice in cold water until the water runs clear. Soak the rice in water for 30 minutes, then drain.',
      'In a large pot, heat ghee or vegetable oil and sauté the sliced onions until golden brown. Remove half of the fried onions and set them aside for later use.',
      'Add the chopped tomatoes and chicken pieces to the pot. Cook until the chicken is partially cooked.',
      'In a separate bowl, mix yogurt with biryani masala and marinate the partially cooked chicken in this mixture for at least 30 minutes.',
      'In a separate pot, bring water to a boil and cook the soaked and drained rice until it is 70% cooked. Drain the rice.',
      'Layer the marinated chicken and partially cooked rice in the pot. Sprinkle the saffron strands soaked in warm milk and the reserved fried onions on top.',
      'Cover the pot tightly with a lid and cook on low heat for about 20-25 minutes or until the rice and chicken are fully cooked.',
      'Gently fluff the biryani with a fork and garnish with fresh coriander and mint leaves before serving.'
    ],
    cookTime: 50,
    difficulty: 'Hard',
    cuisine: 'Indian',
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Chicken Tikka Masala",
    description: "Tender chicken cooked in a creamy tomato sauce with spices.",
    ingredients: ["100g Chicken", "10g Tomatoes", "10g Yogurt"],
    instructions: ["Marinate chicken", "Cook the chicken in a sauce", "Prepare the creamy tomato sauce"],
    cookTime: 30,
    cuisine: "Indian",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Medium",
    createdBy: '64be0641202dda70cf7f635e'
  },
  
  {
    title: "Chocolate Chip Cookies",
    description: "Classic cookies with chocolate chips.",
    ingredients: ["5g Butter", "5g Brown sugar", "10 Eggs", "5g Flour", "2g Chocolate chips"],
    instructions: ["Cream butter and sugar", "Mix in egg and flour", "Add chocolate chips", "Bake the cookies"],
    cookTime: 25,
    cuisine: "Dessert",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Easy",
    createdBy:'64be0641202dda70cf7f635e'
  },
  {
    title: "Beef Stew",
    description: "Hearty stew with tender beef and vegetables.",
    ingredients: ["50g Beef", "10g Potatoes", "10g Carrots", "5g Onions", "10g Beef broth"],
    instructions: ["Brown beef", "Add vegetables and broth", "Simmer until beef is tender"],
    cookTime: 120,
    cuisine: "Comfort Food",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Hard",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Miso Soup",
    description: "Traditional Japanese soup made with miso paste and ingredients like tofu and seaweed.",
    ingredients: ["10g Dashi stock", "2l Miso paste", "10g Tofu", "5g Seaweed", "10g Green onions"],
    instructions: ["Prepare the dashi stock", "Add miso paste and other ingredients", "Simmer until flavors meld"],
    cookTime: 25,
    cuisine: "Japanese",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Easy",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Greek Salad",
    description: "Fresh and colorful salad with tomatoes, cucumbers, olives, and feta cheese.",
    ingredients: ["10g Tomatoes", "20g Cucumbers", "5g Kalamata olives", "5g Feta cheese", "10ml Olive oil"],
    instructions: ["Chop the vegetables and cheese", "Toss everything together", "Drizzle with olive oil"],
    cookTime: 15,
    cuisine: "Greek",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Easy",
    createdBy:'64be0641202dda70cf7f635e'
  },
  {
    title: "Pasta Primavera",
    description: "Spring-inspired pasta dish with fresh vegetables and a light sauce.",
    ingredients: ["100g Pasta", "50g Asparagus", "10g Cherry tomatoes", "Bell peppers", "10g Parmesan cheese"],
    instructions: ["Cook the pasta", "Sauté vegetables", "Toss with pasta and cheese"],
    cookTime: 20,
    cuisine: "Italian",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Medium",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Sushi Rolls",
    description: "Assorted sushi rolls with fresh fish, vegetables, and rice.",
    ingredients: ["2 cups Sushi rice", "2g Nori seaweed", "50g Fresh fish", "20g Avocado", "5g Cucumber"],
    instructions: ["Prepare sushi rice", "Assemble rolls with fillings", "Slice and serve"],
    cookTime: 40,
    cuisine: "Japanese",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Medium",
    createdBy:'64be0641202dda70cf7f635e'
  },
  {
    title: "Chicken Alfredo",
    description: "Creamy pasta dish with grilled chicken and Alfredo sauce.",
    ingredients: ["100g Chicken breasts", "10g Fettuccine", "10g Heavy cream", "5g Parmesan cheese"],
    instructions: ["Cook chicken and pasta", "Prepare Alfredo sauce", "Combine and serve"],
    cookTime: 35,
    cuisine: "Italian",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Medium",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Taco Salad",
    description: "Tex-Mex salad with seasoned ground beef, beans, lettuce, and salsa.",
    ingredients: ["100g Ground beef", "10g Lettuce", "10g Tomatoes", "10g Cheddar cheese", "5g Taco seasoning"],
    instructions: ["Brown ground beef with seasoning", "Assemble salad with toppings", "Serve with salsa"],
    cookTime: 25,
    cuisine: "Tex-Mex",
    imageUrl:'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Easy",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Ratatouille",
    description: "French vegetable stew with eggplant, zucchini, and tomatoes.",
    ingredients: ["10g Eggplant", "10g Zucchini", "10g Tomatoes", "Bell peppers", "Herbs de Provence"],
    instructions: ["Slice and sauté vegetables", "Layer in a baking dish and bake", "Serve hot"],
    cookTime: 50,
    cuisine: "French",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Medium",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Thai Green Curry",
    description: "Spicy and aromatic Thai curry with coconut milk and green curry paste.",
    ingredients: ["100g Chicken thighs", "10ml Coconut milk", "10g Thai green curry paste"],
    instructions: ["Cook chicken and vegetables", "Simmer in coconut milk and curry paste", "Serve with rice"],
    cookTime: 30,
    cuisine: "Thai",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Medium",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Vegetable Fried Rice",
    description: "Flavorful fried rice with mixed vegetables and soy sauce.",
    ingredients: ["200g Cooked rice", "10g Carrots", "5g Peas", "2g Scallions", "1ml Soy sauce"],
    instructions: ["Stir-fry vegetables", "Add rice and soy sauce", "Toss and serve"],
    cookTime: 25,
    cuisine: "Asian",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Easy",
    createdBy: '64be0641202dda70cf7f635e'
  },
  {
    title: "Beef and Broccoli Stir-Fry",
    description: "Quick and tasty stir-fry with beef, broccoli, and a savory sauce.",
    ingredients: ["50g Beef sirloin", "10g Broccoli florets", "1l Soy sauce", "2g Garlic",  "2g Ginger"],
    instructions: ["Marinate beef", "Stir-fry beef and broccoli", "Add sauce and serve"],
    cookTime: 20,
    cuisine: "Asian",
    imageUrl: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Hyderabadi-chicken-Biryani.jpg',
    difficulty: "Easy",
    createdBy:'64be0641202dda70cf7f635e'
  },
 
  
];

const updateSeedRecipesWithNutrition = async () => {
  const appId = '3782178f';
  const appKey = '618881cbbaf25ea4d83a514fb693eff7';
  const apiUrl = 'https://api.edamam.com/api/nutrition-details';

  try {
    for (const recipe of recipes) {
      const requestBody = {
        title: recipe.title,
        ingr: recipe.ingredients
      };

      try {
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

        const nutritionData = response.data;

        // Update the recipe object with nutrition data if available
        if (nutritionData.calories) {
          recipe.calories = nutritionData.calories;
        }
        if (nutritionData.mealType) {
          recipe.mealType = nutritionData.mealType;
        }
        if (nutritionData.dishType) {
          recipe.dishType = nutritionData.dishType;
        }

        // Create a new Recipe document in the database
        const newRecipe = new Recipe(recipe);
        await newRecipe.save();
        
        console.log(`Recipe '${recipe.title}' updated with nutrition data and inserted into the database.`);
      } catch (error) {
        console.error(`Error updating recipe '${recipe.title}':`, error);
        console.log(`Recipe '${recipe.title}' will be skipped due to API error.`);
      }
    }

    console.log('Seed recipes update completed.');
  } catch (error) {
    console.error('Error updating seed recipes:', error);
  }
};

updateSeedRecipesWithNutrition();



 
// Recipe.insertMany(recipes)
//   .then(() => console.log('Recipes inserted successfully!'))
//   .catch((err) => console.error('Error inserting recipes:', err));

//   console.log(Recipe)
  
  
  
// seedDB().then(() => {
//   mongoose.connection.close();
// })