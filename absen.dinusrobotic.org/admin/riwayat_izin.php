<?php
require_once '../config.php';

// Cek login
if (!isLoggedIn()) {
    redirect('login.php');
}

// Cek verifikasi email
requireEmailVerification();

// Ambil user_id dari session
$user_id = $_SESSION['user_id'];

// Filter
$status_filter = isset($_GET['status']) ? $_GET['status'] : '';
$bulan_filter = isset($_GET['bulan']) ? $_GET['bulan'] : '';

// Query dengan JOIN ke tabel users dan jadwalabsen
$query = "SELECT i.*, 
          u.nama_lengkap as nama_user,  
        
          j.tanggal as jadwal_tanggal,
          a.nama_lengkap as approved_by_name
          FROM izin i
          LEFT JOIN users u ON i.user_id = u.id
          LEFT JOIN jadwal_piket j ON i.jadwal_id = j.id
          LEFT JOIN users a ON i.approved_by = a.id
          WHERE i.user_id = ?";

$params = [$user_id];
$types = "i";

if ($status_filter) {
    $query .= " AND i.status = ?";
    $params[] = $status_filter;
    $types .= "s";
}

if ($bulan_filter) {
    $query .= " AND DATE_FORMAT(i.tanggal_izin, '%Y-%m') = ?";
    $params[] = $bulan_filter;
    $types .= "s";
}

$query .= " ORDER BY i.created_at DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();
$riwayat_izin = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Fungsi untuk badge status
function getStatusBadge($status) {
    switch($status) {
        case 'pending':
            return '<span class="badge badge-warning">Pending</span>';
        case 'approved':
            return '<span class="badge badge-success">Disetujui</span>';
        case 'rejected':
            return '<span class="badge badge-danger">Ditolak</span>';
        default:
            return '<span class="badge badge-secondary">-</span>';
    }
}

// Hitung statistik
$pending = 0;
$approved = 0;
$rejected = 0;

foreach ($riwayat_izin as $izin) {
    if ($izin['status'] == 'pending') $pending++;
    if ($izin['status'] == 'approved') $approved++;
    if ($izin['status'] == 'rejected') $rejected++;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Izin - Sistem Absensi</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
        }
        .card {
            border: none;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px 10px 0 0 !important;
            padding: 20px;
        }
        .badge {
            padding: 6px 12px;
            font-size: 0.85em;
            font-weight: 500;
        }
        .badge-warning {
            background-color: #ffc107;
            color: #000;
        }
        .badge-success {
            background-color: #28a745;
        }
        .badge-danger {
            background-color: #dc3545;
        }
        .table-hover tbody tr:hover {
            background-color: #f1f3f5;
            cursor: pointer;
        }
        .btn-filter {
            border-radius: 5px;
        }
        .detail-row {
            background-color: #f8f9fa;
            display: none;
        }
        .stats-card {
            border-left: 4px solid;
            margin-bottom: 15px;
        }
        .stats-pending { border-left-color: #ffc107; }
        .stats-approved { border-left-color: #28a745; }
        .stats-rejected { border-left-color: #dc3545; }
        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .navbar-brand, .nav-link {
            color: white !important;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark mb-4">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-clipboard-check"></i> Sistem Absensi
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php">
                            <i class="fas fa-home"></i> Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="riwayat-izin.php">
                            <i class="fas fa-history"></i> Riwayat Izin
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container my-4">
        <!-- Header -->
        <div class="mb-4">
            <h2><i class="fas fa-history"></i> Riwayat Izin</h2>
            <p class="text-muted">Lihat dan kelola riwayat pengajuan izin Anda</p>
        </div>

        <!-- Statistik -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card stats-card stats-pending">
                    <div class="card-body">
                        <h6 class="text-muted">Pending</h6>
                        <h3><?= $pending ?></h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stats-card stats-approved">
                    <div class="card-body">
                        <h6 class="text-muted">Disetujui</h6>
                        <h3><?= $approved ?></h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stats-card stats-rejected">
                    <div class="card-body">
                        <h6 class="text-muted">Ditolak</h6>
                        <h3><?= $rejected ?></h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card Utama -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-list"></i> Daftar Riwayat Izin</h5>
            </div>
            <div class="card-body">
                <!-- Filter -->
                <form method="GET" class="row g-3 mb-4">
                    <div class="col-md-4">
                        <label class="form-label">Status</label>
                        <select name="status" class="form-select">
                            <option value="">Semua Status</option>
                            <option value="pending" <?= $status_filter == 'pending' ? 'selected' : '' ?>>Pending</option>
                            <option value="approved" <?= $status_filter == 'approved' ? 'selected' : '' ?>>Disetujui</option>
                            <option value="rejected" <?= $status_filter == 'rejected' ? 'selected' : '' ?>>Ditolak</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Bulan</label>
                        <input type="month" name="bulan" class="form-control" value="<?= htmlspecialchars($bulan_filter) ?>">
                    </div>
                    <div class="col-md-4 d-flex align-items-end">
                        <button type="submit" class="btn btn-primary btn-filter me-2">
                            <i class="fas fa-filter"></i> Filter
                        </button>
                        <a href="riwayat-izin.php" class="btn btn-secondary btn-filter">
                            <i class="fas fa-redo"></i> Reset
                        </a>
                    </div>
                </form>

                <!-- Tabel -->
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th width="5%">No</th>
                                <th width="15%">Tanggal Izin</th>
                                <th width="15%">Shift</th>
                                <th width="30%">Alasan</th>
                                <th width="12%">Status</th>
                                <th width="13%">Tanggal Ajuan</th>
                                <th width="5%">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (count($riwayat_izin) > 0): ?>
                                <?php foreach($riwayat_izin as $index => $izin): ?>
                                    <tr onclick="toggleDetail(<?= $izin['id'] ?>)">
                                        <td><?= $index + 1 ?></td>
                                        <td><?= formatTanggal($izin['tanggal_izin']) ?></td>
                                        <td>
                                            <?php if ($izin['shift']): ?>
                                                <span class="badge bg-info"><?= htmlspecialchars($izin['shift']) ?></span>
                                            <?php else: ?>
                                                -
                                            <?php endif; ?>
                                        </td>
                                        <td><?= strlen($izin['alasan']) > 50 ? substr(htmlspecialchars($izin['alasan']), 0, 50) . '...' : htmlspecialchars($izin['alasan']) ?></td>
                                        <td><?= getStatusBadge($izin['status']) ?></td>
                                        <td><?= date('d/m/Y H:i', strtotime($izin['created_at'])) ?></td>
                                        <td>
                                            <button class="btn btn-sm btn-info" onclick="event.stopPropagation(); toggleDetail(<?= $izin['id'] ?>)">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr id="detail-<?= $izin['id'] ?>" class="detail-row">
                                        <td colspan="7">
                                            <div class="p-3">
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <h6><strong>Detail Izin</strong></h6>
                                                        <table class="table table-sm">
                                                            <tr>
                                                                <td width="40%"><strong>Tanggal Izin:</strong></td>
                                                                <td><?= formatTanggal($izin['tanggal_izin']) ?></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Shift:</strong></td>
                                                                <td><?= htmlspecialchars($izin['shift'] ?? '-') ?></td>
                                                            </tr>
                                                            <tr>
                                                                <td><strong>Tanggal Jadwal:</strong></td>
                                                                <td><?= $izin['jadwal_tanggal'] ? formatTanggal($izin['jadwal_tanggal']) : '-' ?></td>
                                                            </tr>
                                                        </table>
                                                        <p><strong>Alasan:</strong><br><?= nl2br(htmlspecialchars($izin['alasan'])) ?></p>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <h6><strong>Informasi Persetujuan</strong></h6>
                                                        <?php if ($izin['status'] != 'pending'): ?>
                                                            <table class="table table-sm">
                                                                <tr>
                                                                    <td width="40%"><strong>Status:</strong></td>
                                                                    <td><?= getStatusBadge($izin['status']) ?></td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Diproses oleh:</strong></td>
                                                                    <td><?= htmlspecialchars($izin['approved_by_name'] ?? '-') ?></td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Tanggal diproses:</strong></td>
                                                                    <td><?= $izin['approved_at'] ? date('d/m/Y H:i', strtotime($izin['approved_at'])) : '-' ?></td>
                                                                </tr>
                                                            </table>
                                                            <?php if ($izin['keterangan_admin']): ?>
                                                                <p><strong>Keterangan Admin:</strong><br><?= nl2br(htmlspecialchars($izin['keterangan_admin'])) ?></p>
                                                            <?php endif; ?>
                                                        <?php else: ?>
                                                            <div class="alert alert-warning">
                                                                <i class="fas fa-clock"></i> Menunggu persetujuan admin
                                                            </div>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="7" class="text-center py-5">
                                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                                        <p class="text-muted">Tidak ada riwayat izin</p>
                                    </td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    <script>
        function toggleDetail(id) {
            const detailRow = document.getElementById('detail-' + id);
            if (detailRow.style.display === 'table-row') {
                detailRow.style.display = 'none';
            } else {
                // Sembunyikan semua detail lain
                document.querySelectorAll('.detail-row').forEach(row => {
                    row.style.display = 'none';
                });
                detailRow.style.display = 'table-row';
            }
        }
    </script>
</body>
</html>