const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files for cover pics
// Serve static files
app.use('/uploads/coverPics', express.static(path.join(__dirname, '../uploads/coverPics')));
app.use('/uploads/postImages', express.static(path.join(__dirname, '../uploads/postImages')));
app.use('/uploads/groupProfilePics', express.static(path.join(__dirname, '../uploads/groupProfilePics')));
app.use('/uploads/groupCoverPics', express.static(path.join(__dirname, '../uploads/groupCoverPics')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/groupPosts', require('./routes/pagePostRoutes'));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
