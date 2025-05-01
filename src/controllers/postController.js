const Post = require('../models/postModel');
const User = require('../models/userModel');
const path = require('path');
const fs = require('fs');

// ✅ Create Post (already done)
const createPost = async (req, res) => {
  try {
    const { userId, caption } = req.body;
    const images = req.files?.map(file => file.filename);

    // Basic validation
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    if (!caption && (!images || images.length === 0)) {
      return res.status(400).json({ message: 'Please provide a caption or at least one image.' });
    }

    // Create the post
    const post = await Post.create({ userId, caption, images });

    // Update user's posts array
    await User.findByIdAndUpdate(userId, {
      $push: { posts: { postId: post._id, date: new Date() } }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (err) {
    console.error('Error creating post:', err); // <-- Console error for server log
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

const toggleLikePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.likes.includes(userId)) {
      post.likes.pull(userId);
      await post.save();
      return res.json({ message: 'Post unliked' });
    } else {
      post.likes.push(userId);
      await post.save();
      return res.json({ message: 'Post liked' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addComment = async (req, res) => {
  const { postId } = req.params;
  const { userId, text } = req.body;

  if (!text) return res.status(400).json({ message: 'Comment text is required' });

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ userId, text });
    await post.save();

    res.json({ message: 'Comment added', post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sharePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.shares.push(userId);
    await post.save();

    res.json({ message: 'Post shared', post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 🔍 Get all posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('userId', 'name email profilePic').sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Find posts
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

// ❌ Delete post by ID
const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Delete image from uploads folder
    const imagePath = path.join(__dirname, '../../uploads', post.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostsByUserId,
  deletePost,
  toggleLikePost,
  addComment,
  sharePost
};

