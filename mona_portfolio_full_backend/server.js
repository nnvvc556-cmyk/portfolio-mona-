const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const SITE_FILE = path.join(DATA_DIR, 'site.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const defaultSite = {
  title: 'ملف إنجاز<br>أ. منى سعيد الزنبحي',
  intro: 'بورتفوليو مهني يعرض جهود وكيلة الشؤون الطلابية في متابعة الطالبات، تطوير البيئة المدرسية، تعزيز الانضباط، وتوثيق المبادرات والإنجازات بصورة عصرية ومنظمة.',
  about: 'وكيلة شؤون طلابية تسعى إلى بناء بيئة مدرسية آمنة ومحفزة، تهتم برعاية الطالبات، متابعة السلوك والمواظبة، دعم البرامج التربوية، وتوثيق العمل المؤسسي بما يعكس جودة الأداء وأثره.'
};
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { fs.writeFileSync(file, JSON.stringify(fallback, null, 2)); return fallback; } }
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, UPLOAD_DIR), filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^\u0600-\u06FFa-zA-Z0-9._-]/g, '-')) });
const upload = multer({ storage });
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/api/site', (req, res) => res.json(readJson(SITE_FILE, defaultSite)));
app.post('/api/site', (req, res) => { const updated = { ...readJson(SITE_FILE, defaultSite), ...req.body }; writeJson(SITE_FILE, updated); res.json({ ok: true, site: updated }); });
app.get('/api/files', (req, res) => res.json(readJson(FILES_FILE, [])));
app.post('/api/upload', upload.array('files'), (req, res) => { const files = readJson(FILES_FILE, []); const newFiles = req.files.map(file => ({ id: String(Date.now()) + Math.random().toString(36).slice(2), originalName: file.originalname, filename: file.filename, type: file.mimetype, size: file.size, url: '/uploads/' + file.filename, uploadedAt: new Date().toISOString() })); writeJson(FILES_FILE, [...newFiles, ...files]); res.json({ ok: true, files: newFiles }); });
app.delete('/api/files/:id', (req, res) => { const files = readJson(FILES_FILE, []); const target = files.find(f => f.id === req.params.id); if (target) { const fullPath = path.join(UPLOAD_DIR, target.filename); if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); } writeJson(FILES_FILE, files.filter(f => f.id !== req.params.id)); res.json({ ok: true }); });
app.listen(PORT, () => console.log(`Portfolio app running on port ${PORT}`));
