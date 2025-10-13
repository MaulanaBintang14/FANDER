// ================================================
// server.js - FANDER Leather Production Backend
// ================================================

import express from "express";
import fs from "fs/promises";
import crypto from "crypto";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
const PORT = 3000;
const DATA_FILE = "./file.json";

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    // Default data
    const defaultData = {
      users: [
        {
          id: crypto.randomUUID(),
          username: "admin",
          password: await bcrypt.hash("admin123", 10),
          isAdmin: true,
        },
      ],
      products: [
        {
          id: crypto.randomUUID(),
          name: "Jaket Kulit Rocker",
          category: "Jaket",
          price: 2500000,
          description:
            "Jaket kulit domba premium dengan desain klasik, tahan lama, dan nyaman dipakai.",
          imageUrl:
            "https://placehold.co/400x300/1f2937/ffffff?text=Jaket+Kulit+Rocker",
        },
        {
          id: crypto.randomUUID(),
          name: "Tas Selempang Pria",
          category: "Tas",
          price: 950000,
          description:
            "Tas kulit sapi asli dengan ruang penyimpanan luas dan desain elegan.",
          imageUrl:
            "https://placehold.co/400x300/374151/ffffff?text=Tas+Selempang+Pria",
        },
        {
          id: crypto.randomUUID(),
          name: "ID Card Kulit",
          category: "Aksesoris",
          price: 550000,
          description:
            "ID Card holder berbahan kulit premium untuk tampilan profesional dan elegan.",
          imageUrl:
            "https://placehold.co/400x300/1f2937/ffffff?text=ID+CARD+Kulit",
        },
      ],
      orders: [],
    };
    await writeData(defaultData);
    return defaultData;
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Authentication helper
function generateToken() {
  return crypto.randomUUID();
}
// --- FITUR L: DASHBOARD ADMIN BARU ---
function goToAdminDashboard() {
  if (!auth.isAdmin) {
    showMessage("Akses Ditolak", "Hanya admin yang dapat membuka dashboard ini.");
    return;
  }

  // Pastikan area form admin disembunyikan (biar tampilan bersih)
  const formContainer = document.getElementById('admin-form-container');
  if (formContainer) formContainer.classList.add('hidden');

  // Navigasi ke halaman admin & muat ulang data
  navigate('admin');
  renderAdminDashboard();

  showMessage("Dashboard Admin", "Kembali ke halaman utama admin berhasil!");
}

async function findUserByToken(token) {
  const data = await readData();
  return data.users.find((u) => u.id === token);
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

// GET ALL PRODUCTS
app.get("/api/products", async (req, res) => {
  const data = await readData();
  res.json(data.products);
});

// GET PRODUCT BY ID
app.get("/api/products/:id", async (req, res) => {
  const data = await readData();
  const product = data.products.find((p) => p.id === req.params.id);
  if (!product)
    return res.status(404).json({ message: "Produk tidak ditemukan." });
  res.json(product);
});

// CREATE PRODUCT (ADMIN)
app.post("/api/products", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = await findUserByToken(token);
  if (!user || !user.isAdmin)
    return res.status(403).json({ message: "Hanya admin yang dapat menambah produk." });

  const { name, category, price, description, imageUrl } = req.body;
  if (!name || !price)
    return res.status(400).json({ message: "Nama dan harga produk wajib diisi." });

  const data = await readData();
  const newProduct = {
    id: crypto.randomUUID(),
    name,
    category,
    price,
    description,
    imageUrl,
  };
  data.products.push(newProduct);
  await writeData(data);

  res.status(201).json({ message: "Produk berhasil ditambahkan.", product: newProduct });
});

// UPDATE PRODUCT (ADMIN)
app.put("/api/products/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = await findUserByToken(token);
  if (!user || !user.isAdmin)
    return res.status(403).json({ message: "Hanya admin yang dapat mengedit produk." });

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
app.delete("/api/products/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = await findUserByToken(token);
  if (!user || !user.isAdmin)
    return res.status(403).json({ message: "Hanya admin yang dapat menghapus produk." });

  const data = await readData();
  const index = data.products.findIndex((p) => p.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ message: "Produk tidak ditemukan." });

  data.products.splice(index, 1);
  await writeData(data);
  res.status(204).send();
});

// CREATE ORDER (COD)
app.post("/api/orders", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const data = await readData();
  const { productId, buyerName, buyerPhone, buyerAddress } = req.body;

  const product = data.products.find((p) => p.id === productId);
  if (!product)
    return res.status(404).json({ message: "Produk tidak ditemukan." });

  const order = {
    id: crypto.randomUUID(),
    userId: token || "guest",
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
app.get("/api/orders", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = await findUserByToken(token);
  if (!user || !user.isAdmin)
    return res.status(403).json({ message: "Hanya admin yang dapat melihat semua pesanan." });

  const data = await readData();
  res.json(data.orders.reverse());
});

// GET USER ORDERS
app.get("/api/orders/user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Token tidak ditemukan." });

  const data = await readData();
  const userOrders = data.orders.filter((o) => o.userId === token);
  res.json(userOrders.reverse());
});

// UPDATE ORDER STATUS (ADMIN)
app.put("/api/orders/:id/status", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = await findUserByToken(token);
  if (!user || !user.isAdmin)
    return res.status(403).json({ message: "Hanya admin yang dapat mengubah status pesanan." });

  const { status } = req.body;
  const data = await readData();
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order)
    return res.status(404).json({ message: "Pesanan tidak ditemukan." });

  order.status = status;
  await writeData(data);
  res.json({ message: "Status pesanan berhasil diperbarui.", order });
});

// UPDATE USER PROFILE
app.put("/api/users/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Unauthorized" });

  const data = await readData();
  const user = data.users.find((u) => u.id === token);
  if (!user)
    return res.status(404).json({ message: "User tidak ditemukan." });

  const { username, password } = req.body;
  if (username) user.username = username;
  if (password) user.password = await bcrypt.hash(password, 10);

  await writeData(data);
  res.json({ message: "Profil berhasil diperbarui." });
});

// ================================================
// SERVER START
// ================================================
app.listen(PORT, () =>
  console.log(`🚀 Server FANDER berjalan di http://localhost:${PORT}`)
);