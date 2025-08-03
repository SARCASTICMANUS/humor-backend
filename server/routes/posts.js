

import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import protect from '../middleware/auth.js';
import mongoose from 'mongoose';
import { createNotification } from './notifications.js';

const router = express.Router();

const authorPopulate = {
    path: 'author',
    select: 'handle bio profilePicUrl humorTag'
};

const deepPopulate = {
    path: 'comments',
    populate: [
        { ...authorPopulate }
    ]
};

const populatePost = (query) => {
    return query.populate(authorPopulate).populate(deepPopulate);
}


// @desc    Fetch all posts
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const postsQuery = Post.find({}).sort({ createdAt: -1 });
        const posts = await populatePost(postsQuery);
        res.json(posts);
    } catch (error)
    {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Fetch a single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const post = await populatePost(Post.findById(req.params.id));
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, async (req, res) => {
    const { text, category, isAnonymous } = req.body;

    if (!text || !category) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let post = new Post({
            text,
            category,
            isAnonymous,
            author: req.user._id,
            reactions: [],
            comments: []
        });

        await post.save();
        post = await populatePost(Post.findById(post._id));

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    React to a post
// @route   POST /api/posts/:id/react
// @access  Private
router.post('/:id/react', protect, async (req, res) => {
    const { reactionType } = req.body;
    if (!['Amused', 'Clever', '...Wow'].includes(reactionType)) {
        return res.status(400).json({ message: 'Invalid reaction type' });
    }

    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        const userId = req.user._id;
        let alreadyReactedType = null;

        // Remove user from any existing reaction on this post and check if they reacted
        post.reactions.forEach(reaction => {
            if (reaction.users.some(u => u.equals(userId))) {
                alreadyReactedType = reaction.type;
                reaction.users.pull(userId);
            }
        });
        
        // If the new reaction is different from the old one, add it
        if (alreadyReactedType !== reactionType) {
            let reaction = post.reactions.find(r => r.type === reactionType);
            if (reaction) {
                reaction.users.push(userId);
            } else {
                 post.reactions.push({ type: reactionType, users: [userId] });
            }
        }
        
        // clean up empty reaction types
        post.reactions = post.reactions.filter(r => r.users.length > 0);

        await post.save();
        
        // Create notification for reaction
        if (alreadyReactedType !== reactionType) {
            await createNotification(post.author.toString(), userId.toString(), 'reaction', req.params.id, {
                reactionType
            });
        }
        
        const updatedPost = await populatePost(Post.findById(req.params.id));
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
    const { text, parentCommentId } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        const newComment = {
            _id: new mongoose.Types.ObjectId(),
            author: req.user._id,
            text,
            reactions: [],
            replies: [],
            timestamp: new Date(),
            parentComment: parentCommentId || null
        };

        if (parentCommentId) {
            // Find the parent comment and add the reply to its replies array
            const parentComment = post.comments.find(comment => 
                comment._id.toString() === parentCommentId
            );
            
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
            
            // Add the new comment to the parent's replies array
            parentComment.replies.push(newComment);
        } else {
            // Add the new comment to the post
            post.comments.push(newComment);
        }
        await post.save();
        
        // Create notification for comment
        await createNotification(post.author.toString(), req.user._id.toString(), 'comment', req.params.id, {
            commentId: newComment._id.toString()
        });
        
        const updatedPost = await populatePost(Post.findById(req.params.id));
        res.status(201).json(updatedPost);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (only post author)
router.put('/:id', protect, async (req, res) => {
    const { text, category, isAnonymous } = req.body;

    if (!text || !category) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        // Check if the current user is the author of the post
        if (!post.author.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }
        
        // Update the post
        post.text = text;
        post.category = category;
        post.isAnonymous = isAnonymous;
        post.updatedAt = new Date();
        
        await post.save();
        const updatedPost = await populatePost(Post.findById(req.params.id));
        
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (only post author)
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        // Check if the current user is the author of the post
        if (!post.author.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }
        
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;