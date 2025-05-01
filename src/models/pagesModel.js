const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  groupCoverImage: { type: String, default: '' },
  groupProfilePic: { type: String, default: '' },
  privacy: { 
    type: String, 
    enum: ['Public', 'Private'], 
    default: 'Public' 
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['Admin', 'Moderator', 'Member'], default: 'Member' },
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  posts: [
      {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        date: { type: Date, default: Date.now }
      }
  ],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For private page join requests
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema);
