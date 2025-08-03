

import mongoose from 'mongoose';

const toJSONTransform = {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
};

const ReactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Amused', 'Clever', '...Wow'],
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { 
  _id: false,
  toJSON: toJSONTransform 
});

// Define CommentSchema without replies first
const CommentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  text: {
    type: String,
    required: true,
  },
  reactions: [ReactionSchema],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, { 
  timestamps: true,
  toJSON: toJSONTransform
});

// Add replies field after CommentSchema is defined
CommentSchema.add({
  replies: [CommentSchema]
});

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  reactions: [ReactionSchema],
  comments: [CommentSchema],
}, { 
  timestamps: true,
  toJSON: toJSONTransform
});

const Post = mongoose.model('Post', PostSchema);

export default Post;