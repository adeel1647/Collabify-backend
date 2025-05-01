const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

const {
    createPagePost,
    getAllPosts,
    getPostsByPageId
    
} = require('../controllers/pagePostController');

router.post('/postcreate', upload.array('images', 10), createPagePost);

// Get all posts
router.get('/', getAllPosts);
router.get('/page/:pageId', getPostsByPageId);


module.exports = router;
