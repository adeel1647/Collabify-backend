const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    getAddress,
    uploadProfilePic,
    updateAddress
  };