import mongoose from 'mongoose';

const toJSONTransform = {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
};

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: ['reaction', 'comment', 'reply']
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  reactionType: {
    type: String,
    enum: ['Amused', 'Clever', '...Wow']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  }
}, { 
  timestamps: true,
  toJSON: toJSONTransform 
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification; 