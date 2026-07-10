import { createApp } from './app';
import db from './config/database';

const app = createApp(db);
const PORT = process.env.PORT || 3000;

// Run migrations on startup, then start listening
db.migrate.latest().then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚗 Car Dealership API running on port ${PORT}`);
  });
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to run migrations:', err);
  process.exit(1);
});
