const mongoose = require('mongoose');

// Connect to MongoDB
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/recipe-app');
  
  }

const db = mongoose.connection;

module.exports = db;
