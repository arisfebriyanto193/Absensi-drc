const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ message: 'Absensi API is running' });
});

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bendaharaRoutes = require('./routes/bendaharaRoutes');
const sekretarisRoutes = require('./routes/sekretarisRoutes');
const inventarisRoutes = require('./routes/inventarisRoutes');
const peminjamanUserRoutes = require('./routes/peminjamanUserRoutes');
const kegiatanAdminRoutes = require('./routes/kegiatanAdminRoutes');
const kegiatanUserRoutes = require('./routes/kegiatanUserRoutes');
const kegiatanBendaharaRoutes = require('./routes/kegiatanBendaharaRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bendahara', bendaharaRoutes);
app.use('/api/sekretaris', sekretarisRoutes);
app.use('/api/inventaris', inventarisRoutes);
app.use('/api/peminjaman', peminjamanUserRoutes);
app.use('/api/admin/kegiatan', kegiatanAdminRoutes);
app.use('/api/kegiatan', kegiatanUserRoutes);
app.use('/api/bendahara/laporan-kegiatan', kegiatanBendaharaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
