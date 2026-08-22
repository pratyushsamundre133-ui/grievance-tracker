require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('Connection error:', err));

const grievanceRoutes = require('./routes/grievanceRoutes');
app.get('/', (req, res) => {
  res.send('Grievance Tracker API is running!');
});
app.use('/api/grievances', grievanceRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});