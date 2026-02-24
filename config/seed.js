// 1. قمنا بتغيير المسار ليبحث في نفس المجلد الحالي أولاً
require('dotenv').config(); 
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Skill = require('../models/Skill');

let config;
try {
  // تأكد من صحة هذا المسار بالنسبة لمكان وجود seed.js
  config = require('../../frontend/src/config/config.json');
  console.log('✅ Loaded config.json');
} catch (err) {
  console.warn('⚠️ Could not load config.json, check path:', err.message);
  config = null;
}

// ... (نفس المتغيرات seedProjects و seedSkills)

async function seed() {
  try {
    // 2. سنستخدم الرابط من الـ env أو الرابط المباشر الذي أرسلته أنت للاحتياط
    const uri = process.env.MONGODB_URI || 'mongodb://ahmad_badwan:ahmad12345@ac-yxkmmq5-shard-00-00.8zbdj3m.mongodb.net:27017,ac-yxkmmq5-shard-00-01.8zbdj3m.mongodb.net:27017,ac-yxkmmq5-shard-00-02.8zbdj3m.mongodb.net:27017/portfolio?ssl=true&authSource=admin&retryWrites=true&w=majority';
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');

    await Project.deleteMany({});
    await Skill.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // استخدام البيانات من الـ config المرفوع
    const projectsToInsert = config?.projects || [];
    const skillsToInsert = config?.skills?.map((s, i) => ({ ...s, order: i })) || [];

    const projects = await Project.insertMany(
      projectsToInsert.map((p, i) => ({ ...p, order: p.order || i }))
    );
    console.log(`🌱 Seeded ${projects.length} projects`);

    const skills = await Skill.insertMany(skillsToInsert);
    console.log(`🌱 Seeded ${skills.length} skills`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();