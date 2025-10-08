// server.js - Versi Lengkap dan Final
// --- PANDUAN MENJALANKAN SERVER ---
// 1. Pastikan Node.js sudah terinstal.
// 2. Buat file package.json: 'npm init -y'
// 3. Instal Express, CORS: 'npm install express cors'
// 4. Jalankan server: 'node server.js'
// ------------------------------------

const express = require('express');
const fs = require('fs').promises; // Menggunakan versi Promise untuk I/O Asinkron
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'file.json');

// --- UTILITY FUNCTION FOR PASSWORD HASHING ---
function hashPassword(password) {
    return crypto.createHash('sha256').update(password + 'simple_salt').digest('hex');
}

// --- UTILITY FUNCTIONS FOR FILE I/O (file.json) (ASYNC) ---

/**
 * Membaca data dari file.json (Async). Membuat data awal jika file tidak ada.
 */
async function readData() {
    try {
        await fs.access(DATA_FILE);
        
        const fileContent = await fs.readFile(DATA_FILE, 'utf8');
        let data = JSON.parse(fileContent);

        // Pastikan semua array ada
        if (!data.orders) data.orders = [];
        if (!data.products) data.products = [];
        if (!data.users) data.users = [];

        return data;

    } catch (error) {
        // Jika file tidak ada atau gagal parsing, buat data awal
        console.warn("File.json tidak ditemukan atau corrupt. Membuat data awal...");
        const initialData = { 
            users: [{
                id: crypto.randomUUID(), 
                username: 'admin', 
                password: hashPassword('admin'), 
                isAdmin: true
            }], 
            products: [
                { id: crypto.randomUUID(), name: 'Jaket Kulit Rocker', category: 'Jaket', price: 2500000, description: 'Jaket kulit domba kualitas premium dengan gaya klasik.', imageUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=JKT-RK' },
                { id: crypto.randomUUID(), name: 'Tas Selempang Pria', category: 'Tas', price: 950000, description: 'Tas kulit sapi asli, cocok untuk kerja dan gaya kasual.', imageUrl: 'https://placehold.co/400x300/374151/ffffff?text=TS-SLMPNG' },
            ],
            orders: []
        };
        await writeData(initialData); 
        return initialData;
    }
}

/**
 * Menulis data ke file.json (Async)
 */
async function writeData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error("Gagal menulis ke file.json:", error.message);
        return false;
    }
}

// --- MIDDLEWARE PENGGUNA TEROTENTIKASI (Wajib Login) ---

/**
 * Middleware untuk memverifikasi token (ID pengguna) dari header Authorization: Bearer <token>.
 */
async function verifyUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null; 
    
    if (!token) { 
        return res.status(401).json({ message: 'Akses ditolak. Token otentikasi tidak ditemukan.' });
    }

    try {
        const data = await readData();
        const user = data.users.find(u => u.id === token);

        if (user) {
            req.user = user;
            next();
        } else {
            res.status(401).json({ message: 'Token tidak sah. Pengguna tidak ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Gagal memverifikasi pengguna.' });
    }
}

// --- ADMIN MIDDLEWARE (Wajib Admin) ---
/**
 * Middleware untuk memverifikasi hak akses Admin.
 */
async function verifyAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null; 

    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Token otentikasi tidak ditemukan.' });
    }

    try {
        const data = await readData();
        const user = data.users.find(u => u.id === token && u.isAdmin); 

        if (user) {
            req.user = user;
            next();
        } else {
            res.status(403).json({ message: 'Akses ditolak. Hanya untuk Admin.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Gagal memverifikasi hak akses Admin.' });
    }
}


// --- GLOBAL MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// DEBUG LOGGING MIDDLEWARE
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Mengizinkan Express melayani file statis (untuk frontend jika ada)
app.use(express.static(path.join(__dirname))); 

// Endpoint untuk melayani index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// =================================================================
// ----------------------- EXPRESS ROUTERS -------------------------
// =================================================================

// --- 1. AUTH ROUTER (Handler dibuat dalam fungsi untuk mempermudah aliasing) ---
const authRouter = express.Router();

// Handler untuk Login (Bisa digunakan di /api/auth/login dan /api/login)
const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password harus diisi.' });
    }
    const hashedPassword = hashPassword(password); 
    try {
        const data = await readData();
        const user = data.users.find(u => u.username === username && u.password === hashedPassword);

        if (user) {
            const token = user.id; 
            res.status(200).json({ token, isAdmin: user.isAdmin, username: user.username });
        } else {
            res.status(401).json({ message: 'Username atau password salah.' });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Kesalahan server saat login.' });
    }
};

// Endpoint Login yang benar
authRouter.post('/login', handleLogin);

// Endpoint Register
authRouter.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.trim() === '' || password.trim() === '') {
        return res.status(400).json({ message: 'Username dan password tidak boleh kosong.' });
    }
    
    try {
        const data = await readData();

        if (data.users.some(u => u.username === username)) {
            return res.status(409).json({ message: 'Username sudah terdaftar.' });
        }

        const newUser = {
            id: crypto.randomUUID(), 
            username,
            password: hashPassword(password),
            isAdmin: false
        };

        data.users.push(newUser);
        if (await writeData(data)) {
            res.status(201).json({ token: newUser.id, isAdmin: false, username: newUser.username });
        } else {
            res.status(500).json({ message: 'Gagal menyimpan data pengguna baru.' });
        }
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: 'Kesalahan server saat registrasi.' });
    }
});


// --- 2. PRODUCT ROUTER ---
const productRouter = express.Router();

// GET All Products (Public)
productRouter.get('/', async (req, res) => {
    try {
        const data = await readData();
        res.status(200).json(data.products);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data produk.' });
    }
});

// GET Single Product (Public)
productRouter.get('/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const data = await readData();
        const product = data.products.find(p => p.id === productId);

        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: 'Produk tidak ditemukan.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data produk.' });
    }
});

// POST Create Product (Admin Protected)
productRouter.post('/', verifyAdmin, async (req, res) => {
    const newProduct = req.body;
    if (!newProduct.name || !newProduct.price || !newProduct.description || !newProduct.category) {
        return res.status(400).json({ message: 'Field Nama, Kategori, Harga, dan Deskripsi harus diisi.' });
    }

    try {
        const data = await readData();
        newProduct.id = crypto.randomUUID();
        newProduct.price = Number(newProduct.price); 
        if (!newProduct.imageUrl) {
            newProduct.imageUrl = 'https://placehold.co/400x300/9ca3af/ffffff?text=No+Image';
        }

        data.products.push(newProduct);

        if (await writeData(data)) {
            res.status(201).json(newProduct);
        } else {
            res.status(500).json({ message: 'Gagal menyimpan produk baru.' });
        }
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({ message: 'Kesalahan server saat membuat produk.' });
    }
});

// PUT Update Product (Admin Protected)
productRouter.put('/:id', verifyAdmin, async (req, res) => {
    const productId = req.params.id;
    const updatedFields = req.body;
    
    try {
        const data = await readData();
        const index = data.products.findIndex(p => p.id === productId);

        if (index !== -1) {
            if (updatedFields.price !== undefined) {
                updatedFields.price = Number(updatedFields.price);
            }
            delete updatedFields.id; // Pastikan ID tidak dapat diubah
            data.products[index] = { ...data.products[index], ...updatedFields };

            if (await writeData(data)) {
                res.status(200).json(data.products[index]);
            } else {
                res.status(500).json({ message: 'Gagal mengupdate produk.' });
            }
        } else {
            res.status(404).json({ message: 'Produk tidak ditemukan.' });
        }
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ message: 'Kesalahan server saat mengupdate produk.' });
    }
});

// DELETE Product (Admin Protected)
productRouter.delete('/:id', verifyAdmin, async (req, res) => {
    const productId = req.params.id;
    
    try {
        const data = await readData();
        const initialLength = data.products.length;

        data.products = data.products.filter(p => p.id !== productId);

        if (data.products.length < initialLength) {
            if (await writeData(data)) {
                res.status(204).send(); // 204 No Content
            } else {
                res.status(500).json({ message: 'Gagal menghapus produk.' });
            }
        } else {
            res.status(404).json({ message: 'Produk tidak ditemukan.' });
        }
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ message: 'Kesalahan server saat menghapus produk.' });
    }
});


// --- 3. ORDER ROUTER (Handler dibuat dalam fungsi untuk mempermudah aliasing) ---
const orderRouter = express.Router();

// POST Create Order (Public/User)
orderRouter.post('/', async (req, res) => {
    const newOrder = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : 'Guest'; 

    if (!newOrder.productId || !newOrder.buyerName || !newOrder.buyerPhone || !newOrder.buyerAddress) {
        return res.status(400).json({ message: 'Semua detail pesanan (produk, nama, telepon, alamat) harus diisi.' });
    }

    try {
        const data = await readData();
        const product = data.products.find(p => p.id === newOrder.productId);

        if (!product) {
            return res.status(400).json({ message: 'ID Produk tidak valid.' });
        }

        const orderRecord = {
            id: crypto.randomUUID(),
            productId: newOrder.productId,
            productName: product.name,
            totalPrice: product.price, 
            buyerName: newOrder.buyerName,
            buyerPhone: newOrder.buyerPhone,
            buyerAddress: newOrder.buyerAddress,
            status: 'Pending', 
            createdAt: new Date().toISOString(),
            userId: token 
        };

        data.orders.push(orderRecord);

        if (await writeData(data)) {
            res.status(201).json({ message: 'Pesanan berhasil dibuat. Kami akan segera memprosesnya!', order: orderRecord });
        } else {
            res.status(500).json({ message: 'Gagal menyimpan pesanan.' });
        }
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ message: 'Kesalahan server saat membuat pesanan.' });
    }
});

// GET Read All Orders (Admin Protected)
orderRouter.get('/', verifyAdmin, async (req, res) => {
    try {
        const data = await readData();
        const sortedOrders = data.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
        res.status(200).json(sortedOrders);
    } catch (error) {
        console.error("Read all orders error:", error);
        res.status(500).json({ message: 'Gagal mengambil data pesanan.' });
    }
});

// Handler untuk Pesanan Pengguna (Bisa digunakan di /api/orders/user dan /api/user/orders)
const handleUserOrders = async (req, res) => {
    // req.user disiapkan oleh middleware verifyUser
    const userId = req.user.id; 
    try {
        const data = await readData();
        const userOrders = data.orders.filter(order => order.userId === userId);
        const sortedUserOrders = userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(sortedUserOrders);
    } catch (error) {
        console.error("Read user orders error:", error);
        res.status(500).json({ message: 'Gagal mengambil data pesanan pengguna.' });
    }
};

// GET Read User's Orders (Endpoint yang benar: /api/orders/user)
orderRouter.get('/user', verifyUser, handleUserOrders);

// PUT Update Order Status (Admin Protected)
orderRouter.put('/:id/status', verifyAdmin, async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Complete', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status tidak valid.' });
    }

    try {
        const data = await readData();
        const index = data.orders.findIndex(o => o.id === orderId);

        if (index !== -1) {
            data.orders[index].status = status;
            
            if (await writeData(data)) {
                res.status(200).json({ message: `Status pesanan ${orderId} berhasil diperbarui menjadi ${status}.`, order: data.orders[index] });
            } else {
                res.status(500).json({ message: 'Gagal mengupdate status pesanan.' });
            }
        } else {
            res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
        }
    } catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({ message: 'Kesalahan server saat mengupdate status pesanan.' });
    }
});


// =================================================================
// -------------------- ERROR HANDLING/ALIAS ROUTES ----------------
// =================================================================

// Fix 1: Alias untuk POST /api/login (Jika frontend memanggil tanpa '/auth')
app.post('/api/login', handleLogin);

// Fix 2: Alias untuk GET /api/user/orders (Jika frontend membalik urutan path)
app.get('/api/user/orders', verifyUser, handleUserOrders);

// =================================================================
// ---------------------- ROUTER INCLUSION -------------------------
// =================================================================

app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);


// --- ERROR HANDLER MIDDLEWARE ---
// Middleware untuk menangani endpoint yang tidak ditemukan (404)
app.use((req, res, next) => {
    // Pesan error ini dibuat spesifik untuk membantu Anda memperbaiki kode klien!
    res.status(404).json({ 
        message: `Endpoint tidak ditemukan: ${req.method} ${req.url}. Pastikan URL Anda benar (misalnya, /api/orders/user bukan /api/orders/user/email).` 
    });
});


// --- START SERVER ---
async function startServer() {
    await readData(); 

    app.listen(PORT, () => {
        console.log(`Server FANDER Leather berjalan di http://localhost:${PORT} 🚀`);
        console.log(`Akses aplikasi di: http://localhost:${PORT}/`);
        console.log("-----------------------------------------");
        console.log("Admin Default: username='admin', password='admin'");
        console.log("Gunakan 'Bearer <token>' di header Authorization untuk akses API.");
        console.log("-----------------------------------------");
    });
}

startServer();
