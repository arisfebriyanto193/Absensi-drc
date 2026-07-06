<?php
require_once '../config.php';

if (!isLoggedIn() || !isAdmin()) {
    redirect('../login.php');
}

$error = '';
$success = '';

// Proses Tambah User
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'tambah') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $nama_lengkap = trim($_POST['nama_lengkap'] ?? '');
    $nim = trim($_POST['nim'] ?? '');
    $role = $_POST['role'] ?? 'user';
    
    if (empty($username) || empty($password) || empty($nama_lengkap) || empty($nim)) {
        $error = 'Semua field harus diisi';
    } elseif (strlen($password) < 6) {
        $error = 'Password minimal 6 karakter';
    } else {
        // Cek username sudah ada
        $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $check->bind_param("s", $username);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            $error = 'Username sudah digunakan';
        } else {
            // Cek NIM sudah ada
            $check_nim = $conn->prepare("SELECT id FROM users WHERE nim = ?");
            $check_nim->bind_param("s", $nim);
            $check_nim->execute();
            if ($check_nim->get_result()->num_rows > 0) {
                $error = 'NIM sudah terdaftar';
            } else {
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO users (username, password, nama_lengkap, nim, role) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("sssss", $username, $hashed_password, $nama_lengkap, $nim, $role);
                
                if ($stmt->execute()) {
                    $success = 'User berhasil ditambahkan';
                } else {
                    $error = 'Gagal menambahkan user';
                }
                $stmt->close();
            }
            $check_nim->close();
        }
        $check->close();
    }
}

// Proses Edit User
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    $user_id = $_POST['user_id'] ?? 0;
    $username = trim($_POST['username'] ?? '');
    $nama_lengkap = trim($_POST['nama_lengkap'] ?? '');
    $nim = trim($_POST['nim'] ?? '');
    $role = $_POST['role'] ?? 'user';
    $password_baru = $_POST['password_baru'] ?? '';
    
    if (empty($username) || empty($nama_lengkap) || empty($nim)) {
        $error = 'Username, Nama Lengkap, dan NIM harus diisi';
    } else {
        // Cek username duplikat (kecuali user sendiri)
        $check = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $check->bind_param("si", $username, $user_id);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            $error = 'Username sudah digunakan user lain';
        } else {
            // Cek NIM duplikat (kecuali user sendiri)
            $check_nim = $conn->prepare("SELECT id FROM users WHERE nim = ? AND id != ?");
            $check_nim->bind_param("si", $nim, $user_id);
            $check_nim->execute();
            if ($check_nim->get_result()->num_rows > 0) {
                $error = 'NIM sudah digunakan user lain';
            } else {
                if (!empty($password_baru)) {
                    if (strlen($password_baru) < 6) {
                        $error = 'Password minimal 6 karakter';
                    } else {
                        $hashed_password = password_hash($password_baru, PASSWORD_DEFAULT);
                        $stmt = $conn->prepare("UPDATE users SET username = ?, password = ?, nama_lengkap = ?, nim = ?, role = ? WHERE id = ?");
                        $stmt->bind_param("sssssi", $username, $hashed_password, $nama_lengkap, $nim, $role, $user_id);
                    }
                } else {
                    $stmt = $conn->prepare("UPDATE users SET username = ?, nama_lengkap = ?, nim = ?, role = ? WHERE id = ?");
                    $stmt->bind_param("ssssi", $username, $nama_lengkap, $nim, $role, $user_id);
                }
                
                if (empty($error) && $stmt->execute()) {
                    $success = 'User berhasil diupdate';
                } else {
                    if (empty($error)) $error = 'Gagal mengupdate user';
                }
                if (isset($stmt)) $stmt->close();
            }
            $check_nim->close();
        }
        $check->close();
    }
}

// Proses Hapus User
if (isset($_GET['hapus'])) {
    $user_id = (int)$_GET['hapus'];
    
    // Cek apakah user yang login
    if ($user_id == $_SESSION['user_id']) {
        $error = 'Tidak dapat menghapus akun sendiri';
    } else {
        // Cek apakah ada jadwal/absensi terkait
        $check_jadwal = $conn->query("SELECT COUNT(*) as count FROM jadwal_piket WHERE user_id = $user_id")->fetch_assoc();
        $check_absensi = $conn->query("SELECT COUNT(*) as count FROM absensi WHERE user_id = $user_id")->fetch_assoc();
        
        if ($check_jadwal['count'] > 0 || $check_absensi['count'] > 0) {
            $error = 'User tidak dapat dihapus karena memiliki jadwal/absensi. Nonaktifkan saja dengan mengubah role.';
        } else {
            if ($conn->query("DELETE FROM users WHERE id = $user_id")) {
                $success = 'User berhasil dihapus';
            } else {
                $error = 'Gagal menghapus user';
            }
        }
    }
}

// Ambil data user untuk edit
$edit_user = null;
if (isset($_GET['edit'])) {
    $edit_id = (int)$_GET['edit'];
    $edit_user = $conn->query("SELECT * FROM users WHERE id = $edit_id")->fetch_assoc();
}

// Ambil daftar user
$search = $_GET['search'] ?? '';
$filter_role = $_GET['role'] ?? '';

$query = "SELECT * FROM users WHERE 1=1";
if (!empty($search)) {
    $search_safe = $conn->real_escape_string($search);
    $query .= " AND (nama_lengkap LIKE '%$search_safe%' OR username LIKE '%$search_safe%' OR nim LIKE '%$search_safe%')";
}
if (!empty($filter_role)) {
    $query .= " AND role = '$filter_role'";
}
$query .= " ORDER BY created_at DESC";

$users = $conn->query($query)->fetch_all(MYSQLI_ASSOC);

// Statistik
$total_users = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()['count'];
$total_admin = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")->fetch_assoc()['count'];
$total_petugas = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'user'")->fetch_assoc()['count'];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kelola User</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <nav class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">👥 Kelola User</h1>
            <a href="dashboard.php" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">Kembali</a>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <?php if ($error): ?>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ⚠️ <?php echo htmlspecialchars($error); ?>
        </div>
        <?php endif; ?>

        <?php if ($success): ?>
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            ✅ <?php echo htmlspecialchars($success); ?>
        </div>
        <?php endif; ?>

        <!-- Statistik -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total User</p>
                        <p class="text-3xl font-bold text-blue-600"><?php echo $total_users; ?></p>
                    </div>
                    <div class="text-4xl">👤</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Admin</p>
                        <p class="text-3xl font-bold text-purple-600"><?php echo $total_admin; ?></p>
                    </div>
                    <div class="text-4xl">👨‍💼</div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Petugas</p>
                        <p class="text-3xl font-bold text-green-600"><?php echo $total_petugas; ?></p>
                    </div>
                    <div class="text-4xl">👷</div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Form Tambah/Edit User -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-lg p-6 sticky top-4">
                    <h2 class="text-xl font-bold mb-4">
                        <?php echo $edit_user ? '✏️ Edit User' : '➕ Tambah User Baru'; ?>
                    </h2>
                    
                    <form method="POST">
                        <input type="hidden" name="action" value="<?php echo $edit_user ? 'edit' : 'tambah'; ?>">
                        <?php if ($edit_user): ?>
                        <input type="hidden" name="user_id" value="<?php echo $edit_user['id']; ?>">
                        <?php endif; ?>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">Username</label>
                            <input type="text" name="username" required 
                                value="<?php echo $edit_user ? htmlspecialchars($edit_user['username']) : ''; ?>"
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">Nama Lengkap</label>
                            <input type="text" name="nama_lengkap" required 
                                value="<?php echo $edit_user ? htmlspecialchars($edit_user['nama_lengkap']) : ''; ?>"
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">NIM</label>
                            <input type="text" name="nim" required 
                                value="<?php echo $edit_user ? htmlspecialchars($edit_user['nim']) : ''; ?>"
                                placeholder="Contoh: 12345678"
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">Role</label>
                            <select name="role" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="user" <?php echo ($edit_user && $edit_user['role'] === 'user') ? 'selected' : ''; ?>>
                                    Petugas (User)
                                </option>
                                <option value="admin" <?php echo ($edit_user && $edit_user['role'] === 'admin') ? 'selected' : ''; ?>>
                                    Administrator
                                </option>
                            </select>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 font-semibold mb-2 text-sm">
                                <?php echo $edit_user ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'; ?>
                            </label>
                            <input type="password" name="<?php echo $edit_user ? 'password_baru' : 'password'; ?>" 
                                <?php echo $edit_user ? '' : 'required'; ?>
                                minlength="6"
                                placeholder="Minimal 6 karakter"
                                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        
                        <div class="flex gap-2">
                            <button type="submit" 
                                class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">
                                <?php echo $edit_user ? '💾 Update' : '➕ Simpan'; ?>
                            </button>
                            <?php if ($edit_user): ?>
                            <a href="kelola_user.php" 
                                class="flex-1 bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500 text-sm text-center">
                                ❌ Batal
                            </a>
                            <?php endif; ?>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Daftar User -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                        <h2 class="text-xl font-bold">📋 Daftar User</h2>
                        
                        <form method="GET" class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <input type="text" name="search" placeholder="Cari nama/username/NIM..." 
                                value="<?php echo htmlspecialchars($search); ?>"
                                class="px-3 py-2 border rounded-lg text-sm flex-1 md:w-48">
                            <select name="role" class="px-3 py-2 border rounded-lg text-sm">
                                <option value="">Semua Role</option>
                                <option value="admin" <?php echo $filter_role === 'admin' ? 'selected' : ''; ?>>Admin</option>
                                <option value="user" <?php echo $filter_role === 'user' ? 'selected' : ''; ?>>Petugas</option>
                            </select>
                            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                                🔍 Cari
                            </button>
                            <?php if (!empty($search) || !empty($filter_role)): ?>
                            <a href="kelola_user.php" class="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 text-sm text-center">
                                Reset
                            </a>
                            <?php endif; ?>
                        </form>
                    </div>
                    
                    <?php if (empty($users)): ?>
                    <div class="bg-gray-100 p-8 rounded text-center">
                        <p class="text-gray-600">Tidak ada user ditemukan</p>
                    </div>
                    <?php else: ?>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left">NIM</th>
                                    <th class="px-4 py-3 text-left">Nama Lengkap</th>
                                    <th class="px-4 py-3 text-left">Username</th>
                                    <th class="px-4 py-3 text-left">Role</th>
                                    <th class="px-4 py-3 text-left">Terdaftar</th>
                                    <th class="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                <?php foreach ($users as $user): ?>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 font-mono text-xs"><?php echo htmlspecialchars($user['nim']); ?></td>
                                    <td class="px-4 py-3 font-semibold"><?php echo htmlspecialchars($user['nama_lengkap']); ?></td>
                                    <td class="px-4 py-3 text-gray-600"><?php echo htmlspecialchars($user['username']); ?></td>
                                    <td class="px-4 py-3">
                                        <?php if ($user['role'] === 'admin'): ?>
                                            <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                                                👨‍💼 Admin
                                            </span>
                                        <?php else: ?>
                                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                                👷 Petugas
                                            </span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="px-4 py-3 text-gray-500 text-xs">
                                        <?php echo date('d/m/Y', strtotime($user['created_at'])); ?>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <div class="flex gap-2 justify-center">
                                            <a href="?edit=<?php echo $user['id']; ?>" 
                                                class="text-blue-600 hover:text-blue-800 text-xs">
                                                ✏️ Edit
                                            </a>
                                            <?php if ($user['id'] != $_SESSION['user_id']): ?>
                                            <a href="?hapus=<?php echo $user['id']; ?>" 
                                                onclick="return confirm('Yakin ingin menghapus user <?php echo htmlspecialchars($user['nama_lengkap']); ?>?')"
                                                class="text-red-600 hover:text-red-800 text-xs">
                                                🗑️ Hapus
                                            </a>
                                            <?php else: ?>
                                            <span class="text-gray-400 text-xs">👤 Anda</span>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="mt-4 text-sm text-gray-600">
                        Total: <strong><?php echo count($users); ?></strong> user
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>