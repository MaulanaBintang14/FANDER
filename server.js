// ================================================
// server.js - FANDER Leather Production Backend
// ================================================

import express from "express";
import fs from "fs/promises";
import crypto from "crypto";
import cors from "cors";
import bcrypt from "bcrypt";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Helper untuk mendapatkan __dirname di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'file.json');


// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        // Default data jika file tidak ada
        console.log("Membuat data default karena file.json tidak ditemukan.");
        const defaultData = {
            users: [{
                id: crypto.randomUUID(),
                username: "admin",
                password: await bcrypt.hash("admin123", 10),
                isAdmin: true,
            }, ],
            products: [{
                id: crypto.randomUUID(),
                name: "Jaket Kulit Rocker",
                category: "Jaket",
                price: 2500000,
                description: "Jaket kulit domba premium dengan desain klasik, tahan lama, dan nyaman dipakai.",
                imageUrl: "https://placehold.co/400x300/1f2937/ffffff?text=Jaket+Kulit+Rocker",
            }, {
                id: crypto.randomUUID(),
                name: "Tas Selempang Pria",
                category: "Tas",
                price: 950000,
                description: "Tas kulit sapi asli dengan ruang penyimpanan luas dan desain elegan.",
                imageUrl: "https://placehold.co/400x300/374151/ffffff?text=Tas+Selempang+Pria",
            }, {
                id: crypto.randomUUID(),
                name: "ID Card Kulit",
                category: "Aksesoris",
                price: 550000,
                description: "ID Card holder berbahan kulit premium untuk tampilan profesional dan elegan.",
                imageUrl: "https://placehold.co/400x300/1f2937/ffffff?text=ID+CARD+Kulit",
            }, ],
            orders: [],
        };
        await writeData(defaultData);
        return defaultData;
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Helper otentikasi
async function findUserByToken(token) {
    if (!token) return null;
    const data = await readData();
    // Di aplikasi ini, token adalah ID pengguna itu sendiri
    return data.users.find((u) => u.id === token);
}

// Middleware untuk otentikasi dan otorisasi admin
const adminOnly = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Akses ditolak. Token tidak disediakan." });
    }
    const user = await findUserByToken(token);
    if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Akses ditolak. Hanya untuk admin." });
    }
    req.user = user; // Menyimpan info user di request untuk digunakan di handler berikutnya
    next();
};

const userOnly = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Akses ditolak. Token tidak disediakan." });
    }
     const user = await findUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: "Token tidak valid." });
    }
    req.user = user;
    next();
}


// ================================================
// ROUTES
// ================================================

// AUTH REGISTER
app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: "Username dan password wajib diisi." });

    const data = await readData();
    const exists = data.users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (exists)
        return res.status(400).json({ message: "Username sudah digunakan." });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
        id: crypto.randomUUID(),
        username,
        password: hashed,
        isAdmin: false,
    };
    data.users.push(newUser);
    await writeData(data);

    res.status(201).json({
        message: "Registrasi berhasil.",
        token: newUser.id,
        username: newUser.username,
        isAdmin: false,
    });
});

// AUTH LOGIN
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const data = await readData();
    const user = data.users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user)
        return res.status(401).json({ message: "Username tidak ditemukan." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ message: "Password salah." });

    res.json({
        message: "Login berhasil.",
        token: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
    });
});

// GET ALL PRODUCTS (Publik)
app.get("/api/products", async (req, res) => {
    const data = await readData();
    res.json(data.products);
});

// GET PRODUCT BY ID (Publik)
app.get("/api/products/:id", async (req, res) => {
    const data = await readData();
    const product = data.products.find((p) => p.id === req.params.id);
    if (!product)
        return res.status(404).json({ message: "Produk tidak ditemukan." });
    res.json(product);
});

// CREATE PRODUCT (ADMIN)
app.post("/api/products", adminOnly, async (req, res) => {
    const { name, category, price, description, imageUrl } = req.body;
    if (!name || !price)
        return res.status(400).json({ message: "Nama dan harga produk wajib diisi." });

    const data = await readData();
    const newProduct = { id: crypto.randomUUID(), name, category, price, description, imageUrl, };
    data.products.push(newProduct);
    await writeData(data);

    res.status(201).json({ message: "Produk berhasil ditambahkan.", product: newProduct });
});

// UPDATE PRODUCT (ADMIN)
app.put("/api/products/:id", adminOnly, async (req, res) => {
    const data = await readData();
    const product = data.products.find((p) => p.id === req.params.id);
    if (!product)
        return res.status(404).json({ message: "Produk tidak ditemukan." });

    const { name, category, price, description, imageUrl } = req.body;
    if (name) product.name = name;
    if (category) product.category = category;
    if (price) product.price = price;
    if (description) product.description = description;
    if (imageUrl) product.imageUrl = imageUrl;

    await writeData(data);
    res.json({ message: "Produk berhasil diperbarui.", product });
});

// DELETE PRODUCT (ADMIN)
app.delete("/api/products/:id", adminOnly, async (req, res) => {
    const data = await readData();
    const index = data.products.findIndex((p) => p.id === req.params.id);
    if (index === -1)
        return res.status(404).json({ message: "Produk tidak ditemukan." });

    data.products.splice(index, 1);
    await writeData(data);
    res.status(204).send();
});

// CREATE ORDER (COD - Bisa oleh user login atau guest)
app.post("/api/orders", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]; // Token bersifat opsional
    const data = await readData();
    const { productId, buyerName, buyerPhone, buyerAddress } = req.body;

    const product = data.products.find((p) => p.id === productId);
    if (!product)
        return res.status(404).json({ message: "Produk tidak ditemukan." });

    const order = {
        id: crypto.randomUUID(),
        userId: token || "guest", // Jika ada token, simpan userId. Jika tidak, 'guest'.
        productId: product.id,
        productName: product.name,
        totalPrice: product.price,
        buyerName,
        buyerPhone,
        buyerAddress,
        status: "Pending",
        createdAt: new Date().toISOString(),
    };

    data.orders.push(order);
    await writeData(data);
    res.status(201).json({ message: "Pesanan berhasil dibuat.", order });
});

// GET ALL ORDERS (ADMIN)
app.get("/api/orders", adminOnly, async (req, res) => {
    const data = await readData();
    res.json(data.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// GET USER'S OWN ORDERS (USER LOGIN)
app.get("/api/orders/user", userOnly, async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    const data = await readData();
    const userOrders = data.orders.filter((o) => o.userId === token);
    res.json(userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// UPDATE ORDER STATUS (ADMIN)
app.put("/api/orders/:id/status", adminOnly, async (req, res) => {
    const { status } = req.body;
    const data = await readData();
    const order = data.orders.find((o) => o.id === req.params.id);
    if (!order)
        return res.status(404).json({ message: "Pesanan tidak ditemukan." });

    order.status = status;
    await writeData(data);
    res.json({ message: "Status pesanan berhasil diperbarui.", order });
});

// UPDATE USER PROFILE (USER LOGIN)
app.put("/api/users/profile", userOnly, async (req, res) => {
    const token = req.user.id;
    const data = await readData();
    const user = data.users.find((u) => u.id === token);
    
    // User seharusnya selalu ditemukan karena middleware userOnly
    if (!user) return res.status(404).json({ message: "User tidak ditemukan." });

    const { username, password } = req.body;
    
    // Cek jika username baru sudah ada (kecuali username user itu sendiri)
    if (username && username.toLowerCase() !== user.username.toLowerCase()) {
        const exists = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if(exists) {
            return res.status(400).json({ message: "Username sudah digunakan." });
        }
        user.username = username;
    }
    
    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    await writeData(data);
    res.json({ message: "Profil berhasil diperbarui." });
});

// ================================================
// SERVER START
// ================================================
app.listen(PORT, () =>
    console.log(`🚀 Server FANDER berjalan di http://localhost:${PORT}`)
);

