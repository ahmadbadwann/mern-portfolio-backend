require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const projectRoutes = require('./routes/projects');
const skillRoutes = require('./routes/skills');
const contactRoutes = require('./routes/contact');

const app = express();

// 1. أضف هذا السطر فوراً لحل مشكلة الـ Rate Limit على Render
app.set('trust proxy', 1); 

const PORT = process.env.PORT || 10000; // Render يفضل 10000

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  // أضفنا هذه لضمان عملها خلف البروكسي
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5,
  message: { error: 'Too many contact submissions, please try again later.' }
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL, // سيقرأ الرابط من Render
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean); // يحذف أي قيم فارغة

app.use(cors({
  origin: (origin, callback) => {
    // في الإنتاج، origin قد يكون undefined في بعض الطلبات، لذا نسمح به
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin); // للتشخيص
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Database ─────────────────────────────────────────────────────────────────
// قمنا بإزالة الخيارات القديمة التي كانت تسبب تحذيرات في سجلاتك
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  // لا تغلق السيرفر فوراً في الإنتاج، دعنا نرى الخطأ أولاً
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ error: 'CORS policy blocked this request' });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;