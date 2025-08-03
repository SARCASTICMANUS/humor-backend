
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import User from './models/User.js';
import Post from './models/Post.js';
import connectDB from './config/db.js';

dotenv.config();
await connectDB();

const importData = async () => {
  try {
    // Drop all collections to start fresh
    await mongoose.connection.dropDatabase();
    console.log('Dropped existing database and cleared all data.');

    const humorTags = ['Sarcastic', 'Dark', 'Wholesome', 'Dry', 'Gen Z', 'Savage', 'Punny'];
    const categories = ['Roasts & Burns', 'Relationship & Dating Humor', 'Tech & Geek Humor', 'Office & College Life', 'Political Satire', 'Random & Toilet Humor'];
    const reactionTypes = ['Amused', 'Clever', '...Wow'];

    // Create Users
    const users = [];
    for (let i = 0; i < 40; i++) {
      const handle = faker.internet.userName().replace(/[^a-zA-Z0-9_]/g, '').substring(0, 15);
      users.push({
        handle,
        password: 'password123', // All users have the same password for seeding
        bio: faker.hacker.phrase(),
        profilePicUrl: `https://picsum.photos/seed/${handle}/100/100`,
        humorTag: faker.helpers.arrayElement(humorTags),
      });
    }

    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created.`);

    // Create Posts
    const posts = [];
    for (let i = 0; i < 50; i++) {
        const author = faker.helpers.arrayElement(createdUsers);
        const postText = faker.lorem.sentence({min: 5, max: 25});
        
        // Generate reactions
        const reactions = [];
        const reactedUserIds = new Set();
        const numReactions = faker.number.int({ min: 0, max: 30 });
        for(let j=0; j < numReactions; j++) {
            const reactingUser = faker.helpers.arrayElement(createdUsers);
            if (!reactedUserIds.has(reactingUser._id.toString())) {
                reactedUserIds.add(reactingUser._id.toString());
                const type = faker.helpers.arrayElement(reactionTypes);
                
                let reaction = reactions.find(r => r.type === type);
                if (reaction) {
                    reaction.users.push(reactingUser._id);
                } else {
                    reactions.push({ type, users: [reactingUser._id] });
                }
            }
        }

        // Generate comments
        const comments = [];
        const numComments = faker.number.int({ min: 0, max: 5});
        for (let k=0; k < numComments; k++) {
            const commentAuthor = faker.helpers.arrayElement(createdUsers);
            comments.push({
                _id: new mongoose.Types.ObjectId(),
                author: commentAuthor._id,
                text: faker.lorem.sentence({ min: 3, max: 10 }),
                timestamp: faker.date.recent({ days: 10 }),
                parentComment: null // Top-level comments
            });
        }
        
        posts.push({
            author: author._id,
            isAnonymous: faker.datatype.boolean(0.1),
            text: postText,
            category: faker.helpers.arrayElement(categories),
            reactions,
            comments,
            createdAt: faker.date.recent({ days: 30 }),
        });
    }
    
    await Post.insertMany(posts);
    console.log(`${posts.length} posts created.`);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

importData();
