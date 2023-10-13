const mongoose = require('mongoose');

// Connect to MongoDB
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/recipe-app');
  
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  }

const db = mongoose.connection;

// Export the database connection object
module.exports = db;
