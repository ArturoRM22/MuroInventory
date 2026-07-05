const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const tortilleriasRoutes = require('./routes/tortillerias.routes');
const movementsRoutes = require('./routes/movements.routes');
const summaryRoutes = require('./routes/summary.routes');
  
const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tortillerias', tortilleriasRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/movements', summaryRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MuroInventory API listening on http://localhost:${config.PORT}`);
});
