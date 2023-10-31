require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const config = require('./config/config');



// Middleware
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

// API Routes
const blogsRouter = require('./routes/blogs');
const usersRouter = require('./routes/auth');

app.use('/api/auth', usersRouter); 
app.use('/api/blog', blogsRouter);


// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
