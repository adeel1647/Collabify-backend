const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

const {
  signup,
  loginUser,
  getAllUsers,
  getUserById,
  uploadCoverPic,
  updateBio,
  getBio,
  addWorkExperience,
  addEducation ,
  updateAddress,
  getUnconnectedUsers,
  uploadProfilePic,
  getAddress,
  pendingfriendlist,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  connectionlist,
} = require('../controllers/userController');

// Register with image
router.post('/signup', upload.single('profilePic'), signup);
router.post('/login', loginUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/cover', upload.single('coverPic'), uploadCoverPic);
router.put('/:id/profile', upload.single('profilePic'), uploadProfilePic);
router.put('/:id/bio', updateBio);
router.get('/:id/bio', getBio);
router.put('/:id/education', addEducation);
router.put('/:id/workExperience', addWorkExperience);
router.put('/:id/update-address', updateAddress);
router.get('/:id/get-address', getAddress);
router.post('/connection', sendFriendRequest);
router.get('/unconnected-users/:id', getUnconnectedUsers);
router.get('/:id/friends', pendingfriendlist);
router.post('/accept', acceptFriendRequest);
router.post('/decline', declineFriendRequest);
router.get('/:userId/connections',connectionlist );

module.exports = router;
