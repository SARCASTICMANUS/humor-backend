import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import Post from './models/Post.js';
import User from './models/User.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('FATAL ERROR: MONGODB_URI is not defined in your .env file.');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample users for mapping
const sampleUsers = [
  {
    handle: 'deepak',
    bio: 'This user is too mysterious for a bio.',
    profilePicUrl: 'https://picsum.photos/seed/deepak/100/100',
    humorTag: 'Dark',
    password: 'password123'
  },
  {
    handle: 'sarah_wit',
    bio: 'Professional overthinker and amateur comedian.',
    profilePicUrl: 'https://picsum.photos/seed/sarah/100/100',
    humorTag: 'Sarcastic',
    password: 'password123'
  },
  {
    handle: 'tech_guru',
    bio: 'I speak fluent JavaScript and broken English.',
    profilePicUrl: 'https://picsum.photos/seed/tech/100/100',
    humorTag: 'Gen Z',
    password: 'password123'
  },
  {
    handle: 'office_warrior',
    bio: 'Surviving corporate life one meme at a time.',
    profilePicUrl: 'https://picsum.photos/seed/office/100/100',
    humorTag: 'Dry',
    password: 'password123'
  },
  {
    handle: 'relationship_expert',
    bio: 'Expert at giving relationship advice I never follow.',
    profilePicUrl: 'https://picsum.photos/seed/relationship/100/100',
    humorTag: 'Wholesome',
    password: 'password123'
  },
  {
    handle: 'roast_master',
    bio: 'I roast people so well, they ask for seconds.',
    profilePicUrl: 'https://picsum.photos/seed/roast/100/100',
    humorTag: 'Savage',
    password: 'password123'
  },
  {
    handle: 'pun_intended',
    bio: 'Making puns that are definitely intended.',
    profilePicUrl: 'https://picsum.photos/seed/pun/100/100',
    humorTag: 'Punny',
    password: 'password123'
  }
];

// Create or get users
const getOrCreateUsers = async () => {
  const users = [];
  for (const userData of sampleUsers) {
    let user = await User.findOne({ handle: userData.handle });
    if (!user) {
      user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.handle}`);
    } else {
      console.log(`Found existing user: ${userData.handle}`);
    }
    users.push(user);
  }
  return users;
};

// Import posts from JSON file
const importPosts = async () => {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, '..', 'post.json');
    const postsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Found ${postsData.length} posts to import`);
    
    // Get or create users
    const users = await getOrCreateUsers();
    
    // Clear existing posts to avoid duplicates
    await Post.deleteMany({});
    console.log('Cleared existing posts');
    
    // Import each post
    for (let i = 0; i < postsData.length; i++) {
      const postData = postsData[i];
      
      // Map to a user (cycle through users)
      const user = users[i % users.length];
      
             // Convert reactions from count-based to user-based structure
      const convertedReactions = (postData.reactions || []).map(reaction => {
        // Use actual user IDs to represent the count, cycling through available users
        const userIds = [];
        for (let i = 0; i < reaction.count; i++) {
          // Cycle through available users to represent the reaction count
          const userIndex = i % users.length;
          userIds.push(users[userIndex]._id);
        }
        return {
          type: reaction.type,
          users: userIds
        };
      });

       // Create post with proper structure
       const post = new Post({
         author: user._id,
         text: postData.text,
         category: postData.category,
         isAnonymous: postData.isAnonymous || false,
         reactions: convertedReactions,
         comments: postData.comments.map(comment => ({
           author: user._id, // Use the same user for comments for simplicity
           text: comment.text,
           reactions: [],
           replies: comment.replies || [],
           timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last week
         }))
       });
      
      await post.save();
      console.log(`Imported post ${i + 1}/${postsData.length}: "${postData.text.substring(0, 50)}..."`);
    }
    
    console.log('✅ All posts imported successfully!');
    
    // Verify import
    const totalPosts = await Post.countDocuments();
    const totalComments = await Post.aggregate([
      { $unwind: '$comments' },
      { $count: 'totalComments' }
    ]);
    
    console.log(`📊 Database now contains:`);
    console.log(`   - ${totalPosts} posts`);
    console.log(`   - ${totalComments[0]?.totalComments || 0} comments`);
    
  } catch (error) {
    console.error('Error importing posts:', error);
  }
};

// Run the import
const runImport = async () => {
  try {
    await connectDB();
    await importPosts();
    console.log('🎉 Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

runImport(); 