const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Token tidak tersedia' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Akses ditolak: Hanya untuk admin' });
    }
};

exports.isBendahara = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'bendahara')) {
        next();
    } else {
        res.status(403).json({ message: 'Akses ditolak: Hanya untuk bendahara atau admin' });
    }
};

exports.isSekretaris = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sekretaris')) {
        next();
    } else {
        res.status(403).json({ message: 'Akses ditolak: Hanya untuk sekretaris atau admin' });
    }
};

exports.isInventaris = (req, res, next) => {
    if (req.user) {
        // Admin always has access
        if (req.user.role === 'admin') return next();
        
        // Check if user has inventaris related jabatan
        if (req.user.jabatan && (req.user.jabatan.includes('Inventaris') || req.user.jabatan.includes('Ketua Umum'))) {
            return next();
        }
    }
    res.status(403).json({ message: 'Akses ditolak: Hanya untuk pengurus inventaris atau admin' });
};

exports.isKetuaInventaris = (req, res, next) => {
    if (req.user) {
        // Admin always has access
        if (req.user.role === 'admin') return next();
        
        // Check if user is Ketua Inventaris or Ketua Umum
        if (req.user.jabatan && (req.user.jabatan.includes('Ketua Inventaris') || req.user.jabatan.includes('Ketua Umum'))) {
            return next();
        }
    }
    res.status(403).json({ message: 'Akses ditolak: Hanya untuk Ketua Inventaris atau admin' });
};
