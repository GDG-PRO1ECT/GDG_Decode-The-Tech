const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decode-the-tech';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;

  console.log('Creating indexes for teams...');
  await db.collection('teams').createIndex({ quizCode: 1, teamId: 1 }, { unique: true });
  await db.collection('teams').createIndex({ teamNumber: 1 });
  await db.collection('teams').createIndex({ isActive: 1 });
  await db.collection('teams').createIndex({ isDisqualified: 1 });
  await db.collection('teams').createIndex({ isEliminated: 1 });
  await db.collection('teams').createIndex({ 'scores.total': -1 });

  console.log('Creating indexes for questions...');
  await db.collection('questions').createIndex({ round: 1 });
  await db.collection('questions').createIndex({ questionNumber: 1 });
  await db.collection('questions').createIndex({ isActive: 1 });

  console.log('Creating indexes for gamesessions...');
  await db.collection('gamesessions').createIndex({ sessionId: 1 }, { unique: true });

  console.log('All indexes created successfully.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error creating indexes:', err);
  process.exit(1);
});
