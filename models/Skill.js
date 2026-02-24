const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
  },
  level: {
    type: Number,
    required: [true, 'Skill level is required'],
    min: [0, 'Level must be between 0 and 100'],
    max: [100, 'Level must be between 0 and 100'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Design', 'Language', 'Other'],
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Skill', skillSchema);
