const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');

// CREATE - Nayi grievance submit karo
router.post('/', async (req, res) => {
  try {
    const grievance = new Grievance(req.body);
    const saved = await grievance.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ - Saari grievances lao
router.get('/', async (req, res) => {
  try {
    const grievances = await Grievance.find().sort({ createdAt: -1 });
    res.json(grievances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ - Ek specific grievance ID se lao
router.get('/:id', async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) return res.status(404).json({ error: 'Grievance not found' });
    res.json(grievance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Status ya details update karo
router.put('/:id', async (req, res) => {
  try {
    const updated = await Grievance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Grievance not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Grievance hatao
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Grievance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Grievance not found' });
    res.json({ message: 'Grievance deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;