const Page = require('../models/pagesModel');
const User = require('../models/userModel');
const path = require('path');
const fs = require('fs');


const createPage = async (req, res) => {
  try {
    const { name, privacy, userId, description } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    let groupProfilePic = '';

    // ✅ Save only the filename instead of full path
    if (req.files && req.files['groupProfilePic']) {
      groupProfilePic = req.files['groupProfilePic'][0].filename;
    }

    const page = new Page({
      name,
      description,
      groupProfilePic,
      privacy,
      creator: userId,
      members: [{ userId, role: 'Admin' }],
    });

    await page.save();

    // ✅ Update user schema with clean filename reference
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          pages: {
            pageId: page._id,
            name: page.name,
            description: page.description || '',
            profileImage: groupProfilePic || ''
          }
        }
      },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      page,
      groupId: page._id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Join a page
const joinPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { userId } = req.user;

    const page = await Page.findById(pageId);

    if (!page) return res.status(404).json({ success: false, message: 'page not found' });

    const alreadyMember = page.members.some(m => m.userId.toString() === userId);

    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    if (page.privacy === 'Private') {
      // Add to pending requests
      if (!page.pendingRequests.includes(userId)) {
        page.pendingRequests.push(userId);
        await page.save();
      }
      return res.status(200).json({ success: true, message: 'Request sent to join the private page' });
    } else {
      // Public page: Directly add
      page.members.push({ userId });
      await page.save();
      return res.status(200).json({ success: true, message: 'Joined page successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Approve Join Request (Private page)
const approveRequest = async (req, res) => {
  try {
    const { pageId, requestId } = req.params;
    const { userId } = req.user;

    const page = await Page.findById(pageId);

    if (!page) return res.status(404).json({ success: false, message: 'page not found' });

    // Only Admin/Moderator can approve
    const adminOrMod = page.members.find(m => m.userId.toString() === userId && ['Admin', 'Moderator'].includes(m.role));
    if (!adminOrMod) {
      return res.status(403).json({ success: false, message: 'Only Admins or Moderators can approve' });
    }

    const pendingIndex = page.pendingRequests.indexOf(requestId);
    if (pendingIndex === -1) {
      return res.status(404).json({ success: false, message: 'No such pending request' });
    }

    page.pendingRequests.splice(pendingIndex, 1);
    page.members.push({ userId: requestId });

    await page.save();
    res.status(200).json({ success: true, message: 'Request approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Leave page
const leavePage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { userId } = req.user;

    const page = await Page.findById(pageId);

    if (!page) return res.status(404).json({ success: false, message: 'page not found' });

    page.members = page.members.filter(m => m.userId.toString() !== userId);
    await page.save();

    res.status(200).json({ success: true, message: 'Left page successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get All pages
const getAllPages = async (req, res) => {
  try {
    const pages = await Page.find().populate('creator', 'firstName lastName groupProfilePic');
    res.status(200).json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Single page Details
const getPageById = async (req, res) => {
  try {
    const { pageId } = req.params;

    // Fetch the page by ID
    const page = await Page.findById(pageId);

    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Fetch the creator's specific details
    const creator = await User.findById(page.creator, 'firstName lastName email profilePic');

    // Fetch the specific details of each member
    const members = await Promise.all(
      page.members.map(async (member) => {
        const user = await User.findById(member.userId, 'firstName lastName email profilePic');
        return { ...member.toObject(), user };
      })
    );

    // Fetch the full details of each pending request (if needed)
    const pendingRequests = await Promise.all(
      page.pendingRequests.map(async (request) => {
        const user = await User.findById(request, 'firstName lastName email profilePic');
        return user;
      })
    );

    // Prepare the response with the full data
    const response = {
      success: true,
      page: {
        ...page.toObject(),
        creator, // Only the selected fields for the creator
        members, // Only the selected fields for members
        pendingRequests, // Full pending requests if necessary
      },
    };

    // Send the response
    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getPagesByUser = async (req, res) => {
  try {
    const { userId } = req.params; // Get the user ID from the route parameter

    // Fetch pages where the user is the creator
    const pages = await Page.find({ creator: userId });

    if (pages.length === 0) {
      return res.status(404).json({ success: false, message: 'No pages found for this user' });
    }

    // Prepare the response with the selected fields only for each page
    const response = pages.map(page => ({
      _id: page._id,
      name: page.name,
      description: page.description,
      groupProfilePic: page.groupProfilePic,
      createdAt: page.createdAt,
      privacy: page.privacy
    }));

    // Send the response
    res.status(200).json({
      success: true,
      pages: response,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const uploadOrUpdateCoverPhoto = async (req, res) => {
  try {
    const { pageId } = req.params;

    if (!req.files || !req.files['groupCoverImage']) {
      return res.status(400).json({ success: false, message: 'No cover image uploaded' });
    }

    const newCoverImage = req.files['groupCoverImage'][0].filename;

    const page = await Page.findById(pageId);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Remove old cover image if exists
    if (page.groupCoverImage) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'groupCoverPics', page.groupCoverImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new cover image filename to the page document
    page.groupCoverImage = newCoverImage;
    await page.save();

    res.status(200).json({
      success: true,
      message: 'Cover photo uploaded/updated successfully',
      groupCoverImage: newCoverImage,
      groupCoverImageUrl: `/uploads/groupCoverPics/${newCoverImage}`,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const updatePage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { name, description, privacy } = req.body;

    const page = await Page.findById(pageId);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Handle new profile image if uploaded
    let newProfilePic = page.groupProfilePic;

    if (req.files && req.files['groupProfilePic']) {
      const uploadedPic = req.files['groupProfilePic'][0].filename;

      // Delete old image from filesystem
      if (page.groupProfilePic) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'groupProfilePics', page.groupProfilePic);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      newProfilePic = uploadedPic;
    }

    // Update fields
    page.name = name || page.name;
    page.description = description || page.description;
    page.privacy = privacy || page.privacy;
    page.groupProfilePic = newProfilePic;

    await page.save();

    res.status(200).json({
      success: true,
      message: 'Page updated successfully',
      page,
    });

  } catch (error) {
    console.error('Update Page Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};







const deletedata = async (req, res) => {
  try {
    // 1. Delete all pages from the Page collection
    await Page.deleteMany({});

    // 2. Remove all 'pages' entries from users
    await User.updateMany({}, { $set: { pages: [] } });

    res.status(200).json({
      success: true,
      message: 'All pages deleted and users updated successfully.',
    });

  } catch (error) {
    console.error('Error while deleting pages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting pages and updating users.',
      error: error.message
    });
  }
};


module.exports={

    createPage,
    joinPage,
    approveRequest,
    leavePage,
    getAllPages,
    getPagesByUser,
    updatePage,
    getPageById,
    deletedata,
    uploadOrUpdateCoverPhoto
}