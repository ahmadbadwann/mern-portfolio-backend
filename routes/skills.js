const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');

// GET /api/skills
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const skills = await Skill.find(filter)
      .sort({ order: 1, level: -1 })
      .select('-__v');

    // Group by category
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {});

    res.json({ success: true, count: skills.length, data: skills, grouped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
