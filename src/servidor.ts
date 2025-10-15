import app, { connectDB } from './app';
import database, { testConnection } from '../config/database';

const PORT = process.env.PORT || 3000;

// Initialize database connection and sync models
testConnection().then(async () => {
  await connectDB();
  console.log('Database models synchronized successfully');
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});