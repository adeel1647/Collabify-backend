const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const sortEducation = (education) => {
  const currentEducation = education.filter(edu => edu.to === "Present");
  const pastEducation = education.filter(edu => edu.to !== "Present");
  
  // Sort past education by 'from' date in descending order
  pastEducation.sort((a, b) => new Date(b.from) - new Date(a.from));
  
  // Return the sorted education array: current first, then past
  return [...currentEducation, ...pastEducation];
};

const sortWorkExperience = (workExperience) => {
  const currentWork = workExperience.filter(work => work.to === "Present");
  const pastWork = workExperience.filter(work => work.to !== "Present");
  
  // Sort past work by 'from' date in descending order
  pastWork.sort((a, b) => new Date(b.from) - new Date(a.from));
  
  // Return the sorted work experience array: current first, then past
  return [...currentWork, ...pastWork];
};


// Register
const signup = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    mobileNumber,
    dateOfBirth,
    address,
    gender
  } = req.body;

  const profilePic = req.file?.filename;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Required fields are missing.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profilePic,
      mobileNumber,
      dateOfBirth,
      address,
      gender
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      profilePic: user.profilePic || "",
      email: user.email,
      gender: user.gender,
      token
    });    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password field
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sort the education and work experience arrays
    user.education = sortEducation(user.education);
    user.workExperience = sortWorkExperience(user.workExperience);
    
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Invalid user ID' });
  }
};
// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
  const uploadCoverPic = async (req, res) => {
    try {
      const userId = req.params.id;
      const coverPic = req.file?.filename;
  
      if (!coverPic) return res.status(400).json({ message: 'No image uploaded' });
  
      const user = await User.findByIdAndUpdate(
        userId,
        { coverPic },
        { new: true }
      );
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json({ message: 'Cover picture updated', user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const uploadProfilePic = async (req, res) => {
    try {
      const userId = req.params.id;
      const profilePic = req.file?.filename;
  
      if (!profilePic) return res.status(400).json({ message: 'No image uploaded' });
  
      const user = await User.findByIdAndUpdate(
        userId,
        { profilePic },
        { new: true }
      );
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json({ message: 'Profile picture updated', user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const updateBio = async (req, res) => {
    try {
      const userId = req.params.id;
      const { bio } = req.body;
  
      const user = await User.findByIdAndUpdate(
        userId,
        { bio },
        { new: true }
      );
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json({ message: 'Bio updated', user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const getBio = async (req, res) => {
    try {
      const userId = req.params.id;
  
      const user = await User.findById(userId).select('bio'); // only select 'bio' field
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ bio: user.bio || '' }); // Return empty string if bio not set
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const addEducation = async (req, res) => {
    try {
      const userId = req.params.id;
      const { degree, institution, from, to } = req.body;
  
      if (!degree || !institution || !from || !to) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const user = await User.findById(userId);
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Add new education to the user's education array
      user.education.push({ degree, institution, from, to });
  
      // Save the updated user
      await user.save();
  
      res.json({ message: 'Education added', user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const addWorkExperience = async (req, res) => {
    try {
      const userId = req.params.id;
      const { jobTitle, company, from, to } = req.body;
  
      if (!jobTitle || !company || !from || !to) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const user = await User.findById(userId);
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Add new work experience to the user's workExperience array
      user.workExperience.push({ jobTitle, company, from, to });
  
      // Save the updated user
      await user.save();
  
      res.json({ message: 'Work experience added', user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };   
  const getAddress = async (req, res) => {
    try {
      const userId = req.params.id;
  
      const user = await User.findById(userId).select('address'); // only select 'address' field
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ address: user.address || '' }); // Return empty string if address is not set
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const updateAddress = async (req, res) => {
    try {
      const userId = req.params.id;
      const { address } = req.body;
  
      if (!address) {
        return res.status(400).json({ message: 'Address is required' });
      }
  
      const user = await User.findByIdAndUpdate(
        userId,
        { address },
        { new: true }
      );
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json({ message: 'Address updated', user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const sendFriendRequest = async (req, res) => {
    const { senderId, receiverId } = req.body;
  
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: 'Sender and receiver IDs are required.' });
    }
  
    if (senderId === receiverId) {
      return res.status(400).json({ message: 'You cannot send a request to yourself.' });
    }
  
    try {
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);
  
      if (!sender || !receiver) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Check if request already exists
      const existingRequest = receiver.friends.find(
        (f) => f.userId.toString() === senderId
      );
  
      if (existingRequest) {
        return res.status(409).json({ message: 'Friend request already sent or exists.' });
      }
  
      // Add request to receiver's friends list
      receiver.friends.push({
        userId: senderId,
        status: 'pending',
        dateAdded: new Date()
      });
  
      await receiver.save();
  
      return res.status(200).json({ message: 'Friend request sent successfully.' });
  
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };


  const pendingfriendlist = async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Find user and populate friends
      const user = await User.findById(userId)
        .populate('friends.userId', 'firstName lastName email profilePic education workExperience connections') // only select these fields
        .exec();
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Optional: filter only accepted friends
      const acceptedFriends = user.friends.filter(friend => friend.status === 'pending');
  
      res.status(200).json({ friends: acceptedFriends });
  
    } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };

  const getUnconnectedUsers = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId).exec();
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const friendIds = user.friends.map(friend => friend.userId.toString());
      const connectionIds = user.connectionList.map(conn => conn.userId.toString());
      const excludeIds = new Set([...friendIds, ...connectionIds, userId]);
  
      // Extract user's bio, institution and address (if available)
      const userBio = user.bio?.toLowerCase() || '';
      const userAddress = user.address?.toLowerCase() || '';
      const userInstitutions = user.education?.map(ed => ed.institution?.toLowerCase()) || [];
  
      // Build filters to match similar users and exclude incomplete profiles
      const smartSuggestions = await User.find({
        _id: { $nin: Array.from(excludeIds) },
        bio: { $exists: true, $ne: '' },
        education: { $exists: true, $not: { $size: 0 } },
        workExperience: { $exists: true, $not: { $size: 0 } },
        $or: [
          { bio: { $regex: userBio.split(' ')[0] || '', $options: 'i' } },
          { address: { $regex: userAddress.split(' ')[0] || '', $options: 'i' } },
          { 'education.institution': { $in: userInstitutions } }
        ]
      })
        .select('firstName lastName profilePic connections education workExperience')
        .limit(15);
  
      res.status(200).json(smartSuggestions);
    } catch (err) {
      console.error('Error fetching smart suggestions:', err);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
  

  const acceptFriendRequest = async (req, res) => {
    const { receiverId, senderId } = req.body;
  
    if (!receiverId || !senderId) {
      return res.status(400).json({ message: 'Receiver and sender IDs are required.' });
    }
  
    try {
      const receiver = await User.findById(receiverId);
      const sender = await User.findById(senderId);
  
      if (!receiver || !sender) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Find the friend request
      const requestIndex = receiver.friends.findIndex(
        (f) => f.userId.toString() === senderId && f.status === 'pending'
      );
  
      if (requestIndex === -1) {
        return res.status(404).json({ message: 'No pending friend request found.' });
      }
  
      // Remove from friends list
      receiver.friends.splice(requestIndex, 1);
  
      // Add to connection list
      receiver.connectionList.push({
        userId: senderId,
        dateAdded: new Date(),
        isFavorite: false,
        lastInteraction: new Date()
      });
  
      // Increment connection count
      receiver.connections += 1;
  
      // Also update sender's connection list (mutual connection)
      sender.connectionList.push({
        userId: receiverId,
        dateAdded: new Date(),
        isFavorite: false,
        lastInteraction: new Date()
      });
      sender.connections += 1;
  
      await receiver.save();
      await sender.save();
  
      return res.status(200).json({ message: 'Friend request accepted.' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  
  const declineFriendRequest = async (req, res) => {
    const { receiverId, senderId } = req.body;
  
    if (!receiverId || !senderId) {
      return res.status(400).json({ message: 'Receiver and sender IDs are required.' });
    }
  
    try {
      const receiver = await User.findById(receiverId);
  
      if (!receiver) {
        return res.status(404).json({ message: 'Receiver not found.' });
      }
  
      const friendRequest = receiver.friends.find(
        (f) => f.userId.toString() === senderId && f.status === 'pending'
      );
  
      if (!friendRequest) {
        return res.status(404).json({ message: 'No pending friend request found.' });
      }
  
      friendRequest.status = 'rejected';
  
      await receiver.save();
  
      return res.status(200).json({ message: 'Friend request declined.' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };

  const connectionlist = async (req, res) => {
    const { userId } = req.params;
  
    try {
      const user = await User.findById(userId)
        .populate({
          path: 'connectionList.userId',
          select: 'firstName lastName profilePic'
        });
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Extract populated connectionList
      const connections = user.connectionList.map(conn => ({
        userId: conn.userId._id,
        fullName: `${conn.userId.firstName} ${conn.userId.lastName}`,
        profilePic: conn.userId.profilePic,
        dateAdded: conn.dateAdded,
        isFavorite: conn.isFavorite,
        lastInteraction: conn.lastInteraction
      }));
  
      res.status(200).json({ success: true, connections });
    } catch (error) {
      console.error('Error fetching connections:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
  
  
  
  
  
  
  module.exports = {
    signup,
    loginUser,
    getAllUsers,
    getUserById,
    uploadCoverPic,
    updateBio,
    getBio,
    addEducation,
    addWorkExperience,
    getUnconnectedUsers,
    getAddress,
    uploadProfilePic,
    updateAddress,
    sendFriendRequest,
    pendingfriendlist,
    acceptFriendRequest,
    connectionlist,
    declineFriendRequest
  };