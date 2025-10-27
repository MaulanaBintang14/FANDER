import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "file.json");

// ===== Middleware dasar =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ===== Hilangkan error Chrome DevTools CSP =====
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).send();
});

// ===== Fungsi bantu untuk baca/tulis file.json =====
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ products: [], orders: [] }, null, 2));
    }

    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);

    if (!data.products) data.products = [];
    if (!data.orders) data.orders = [];

    return data;
  } catch (err) {
    console.error("❌ Gagal membaca file.json, membuat file baru...");
    const data = { products: [], orders: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== Muat data awal dari file.json =====
let { products, orders } = loadData();

// ===== ROUTE UTAMA =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===== API AUTH (Login & Register) =====
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username dan password wajib diisi.",
    });
  }

  if (username === "admin" && password === "admin123") {
    return res.json({
      success: true,
      username,
      isAdmin: true,
      token: "fake-admin-token",
      message: "Login berhasil sebagai Admin!",
    });
  }

  // Login user biasa
  return res.json({
    success: true,
    username,
    isAdmin: false,
    token: "fake-user-token",
    message: "Login berhasil sebagai User!",
  });
});

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Semua kolom wajib diisi.",
    });
  }

  return res.json({
    success: true,
    message: `Akun ${username} berhasil didaftarkan!`,
  });
});

// ===== API PRODUCTS =====
app.get("/api/products", (req, res) => {
  const data = loadData();
  res.json(data.products);
});

app.post("/api/products", (req, res) => {
  const { name, price, category, description, imageUrl } = req.body;
  const numericPrice = Number(price);

  if (!name || !category) {
    return res.status(400).json({
      success: false,
      message: "Nama dan kategori wajib diisi.",
    });
  }

  if (isNaN(numericPrice) || numericPrice < 10000 || numericPrice > 10000000) {
    return res.status(400).json({
      success: false,
      message: "Harga harus antara Rp 10.000 dan Rp 10.000.000.",
    });
  }

  const newProduct = {
    id: Date.now().toString(),
    name,
    price: numericPrice,
    category,
    description,
    imageUrl,
  };

  const data = loadData();
  data.products.push(newProduct);
  saveData(data);

  res.status(201).json({
    success: true,
    message: "Produk berhasil ditambahkan!",
    data: newProduct,
  });
});

app.put("/api/products/:id", (req, res) => {
  const data = loadData();
  const index = data.products.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Produk tidak ditemukan" });
  }

  const updatedData = { ...req.body };
  if (updatedData.price !== undefined) {
    const numericPrice = Number(updatedData.price);
    if (isNaN(numericPrice) || numericPrice < 10000 || numericPrice > 10000000) {
      return res.status(400).json({
        success: false,
        message: "Harga harus antara Rp 10.000 dan Rp 10.000.000.",
      });
    }
    updatedData.price = numericPrice;
  }

  data.products[index] = { ...data.products[index], ...updatedData };
  saveData(data);

  res.json({
    success: true,
    message: "Produk berhasil diperbarui.",
    data: data.products[index],
  });
});

app.delete("/api/products/:id", (req, res) => {
  const data = loadData();
  data.products = data.products.filter((p) => p.id !== req.params.id);
  saveData(data);
  res.status(204).send();
});

// ===== API ORDERS =====
app.get("/api/orders", (req, res) => {
  const data = loadData();
  res.json(data.orders);
});

app.post("/api/orders", (req, res) => {
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
    status: "Pending",
    createdAt: new Date(),
  };

  const data = loadData();
  data.orders.push(newOrder);
  saveData(data);

  res.status(201).json({
    message: "Pesanan berhasil dibuat",
    order: newOrder,
  });
});

app.put("/api/orders/:id/status", (req, res) => {
  const data = loadData();
  const order = data.orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Pesanan tidak ditemukan" });
  }

  order.status = req.body.status;
  saveData(data);

  res.json({ message: "Status pesanan diperbarui", order });
});

// ===== Jalankan Server =====
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
