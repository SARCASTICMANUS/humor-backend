


import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'a_very_insecure_default_secret_for_dev';
    if (!process.env.JWT_SECRET) {
        console.warn('Warning: JWT_SECRET not set in .env file. Using a default, insecure secret. THIS IS NOT SAFE FOR PRODUCTION.');
    }
    return jwt.sign({ id }, secret, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
    const { handle, password, humorTag } = req.body;

    if (!handle || !password || !humorTag) {
        return res.status(400).json({ message: 'Please provide handle, password, and humorTag' });
    }

    try {
        const userExists = await User.findOne({ handle: new RegExp(`^${handle}$`, 'i') });

        if (userExists) {
            return res.status(400).json({ message: 'User with that handle already exists' });
        }

        const user = await User.create({
            handle,
            password,
            humorTag,
            profilePicUrl: `https://picsum.photos/seed/${handle}/100/100`
        });
        
        const token = generateToken(user._id);
        res.status(201).json({
            ...user.toJSON(),
            token,
        });

    } catch (error) {
         res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { handle, password } = req.body;

    try {
        const user = await User.findOne({ handle: new RegExp(`^${handle}$`, 'i') });

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id);
            res.json({
                ...user.toJSON(),
                token,
            });
        } else {
            res.status(401).json({ message: 'Invalid handle or password' });
        }
    } catch(error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

export default router;