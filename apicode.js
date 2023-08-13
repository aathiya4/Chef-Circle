
const axios = require('axios');

async function fetchNutritionalData(ingredient) {
  const appId = '3782178f';
  const apiKey = '618881cbbaf25ea4d83a514fb693eff7';
  const apiUrl = `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${apiKey}&ingr=${encodeURIComponent(ingredient)}`;

  try {
    const response = await axios.get(apiUrl);

    // Extract the nutritional data from the response
    const nutritionData = response.data;

    return nutritionData;
  } catch (error) {
    console.error('Error fetching nutritional data:', error.message);
    return null;
  }
}

module.exports = fetchNutritionalData;
