const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  profilePic: String,
  mobileNumber: { type: String, unique: true, required: true },
  dateOfBirth: Date,
  address: String,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  coverPic: String,
  bio: String,
  connections: { type: Number, default: 0 },

  education: [
    {
      degree: String,
      institution: String,
      from: String,
      to: String
    }
  ],
  workExperience: [
    {
      jobTitle: String,
      company: String,
      from: String,
      to: String
    }
  ],
  posts: [
    {
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      date: { type: Date, default: Date.now }
    }
  ],

  // 👇 Add this new field for pages
  pages: [
    {
      pageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
      name: String,
      description: String,
      profileImage: String
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
