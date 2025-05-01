const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

const {
  createPost,
  getAllPosts,
  getPostsByUserId,
  deletePost,
  toggleLikePost,
  addComment,
  sharePost
} = require('../controllers/postController');

// Create post with multiple images
router.post('/postcreate', upload.array('images', 10), createPost);

// Get all posts
router.get('/', getAllPosts);

// Get post by ID
router.get('/user/:userId', getPostsByUserId);

// Delete post
router.delete('/:id', deletePost);

// Like / Unlike a post
router.post('/:postId/like', toggleLikePost);

// Add comment to post
router.post('/:postId/comment', addComment);

// Share a post
router.post('/:postId/share', sharePost);

module.exports = router;
