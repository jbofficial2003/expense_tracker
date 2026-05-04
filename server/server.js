const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Route files
const auth = require('./routes/auth');
const trips = require('./routes/trips');
const expenses = require('./routes/expenses');
const reports = require('./routes/reports');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/trips', trips);
app.use('/api/expenses', expenses);
app.use('/api/reports', reports);

app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
