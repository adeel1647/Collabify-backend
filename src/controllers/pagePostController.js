
const PagePost = require('../models/pagePostsModel');
const User = require('../models/userModel');
const Page = require('../models/pagesModel');

const path = require('path');
const fs = require('fs');
// Create a new page post
const createPagePost = async (req, res) => {
  try {
      const { userId, pageId, caption } = req.body;
      const images = req.files?.map(file => file.filename);
  
      // Basic validation
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      if (!pageId) {
        return res.status(400).json({ message: 'pageId is required' });
      }
  
      if (!caption && (!images || images.length === 0)) {
        return res.status(400).json({ message: 'Please provide a caption or at least one image.' });
      }
  
      // Create the post
      const post = await PagePost.create({ userId, pageId, caption, images });
  
      // Update user's posts array
      await Page.findByIdAndUpdate(userId, {
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

const getAllPosts = async (req, res) => {
  try {
    const posts = await PagePost.find().populate('userId', 'name email profilePic').sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getPostsByPageId = async (req, res) => {
  try {
    const { pageId } = req.params;

    // Validate
    if (!pageId) {
      return res.status(400).json({ message: 'pageId is required' });
    }

    // Find posts
    const posts = await PagePost.find({ pageId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (err) {
    console.error('Error fetching page posts:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

module.exports = {
    createPagePost,
    getAllPosts,
    getPostsByPageId

}