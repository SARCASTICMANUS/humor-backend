import express from 'express';
import auth from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'handle profilePicUrl')
      .populate('post', 'text')
      .populate('comment', 'text')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Helper function to create notification
export const createNotification = async (recipientId, senderId, type, postId, options = {}) => {
  try {
    const sender = await User.findById(senderId);
    const post = await Post.findById(postId);
    
    if (!sender || !post) return;

    let message = '';
    switch (type) {
      case 'reaction':
        message = `${sender.handle} reacted with ${options.reactionType} to your post`;
        break;
      case 'comment':
        message = `${sender.handle} commented on your post`;
        break;
      case 'reply':
        message = `${sender.handle} replied to your comment`;
        break;
    }

    // Don't create notification if sender is the same as recipient
    if (senderId === recipientId) return;

    // Check if notification already exists for this action
    const existingNotification = await Notification.findOne({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      isRead: false
    });

    if (existingNotification) return;

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      comment: options.commentId,
      reactionType: options.reactionType,
      message
    });

    await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export default router; 