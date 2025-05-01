const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureFolderExists = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};
// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check which folder to save in
    if (file.fieldname === 'coverPic') {
      console.log('Saving cover picture to:', 'uploads/coverPics/');
      cb(null, 'uploads/coverPics/');
    } else if (file.fieldname === 'images') {
      console.log('Saving post images to:', 'uploads/postImages/');
      cb(null, 'uploads/postImages/');
    } else if (file.fieldname === 'groupProfilePic') {
      const profilePath = 'uploads/groupProfilePics/';
      ensureFolderExists(profilePath);
      cb(null, profilePath);
    } else if (file.fieldname === 'groupCoverImage') {
      const coverPath = 'uploads/groupCoverPics/';
      ensureFolderExists(coverPath);
      cb(null, coverPath);
    }
     else {
      cb(null, 'uploads/'); // default fallback (not expected to happen)
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    console.log('File name:', uniqueName);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;
