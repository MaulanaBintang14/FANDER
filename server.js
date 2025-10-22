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
    // Jika file.json belum ada, buat file baru
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ products: [], orders: [] }, null, 2));
    }

    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);

    // Pastikan selalu ada struktur dasar
    if (!data.products) data.products = [];
    if (!data.orders) data.orders = [];

    return data;
  } catch (err) {
    console.error("❌ Gagal membaca file.json. Membuat file baru...");
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

// ===== API PRODUCTS =====

// Ambil semua produk (langsung baca ulang dari file.json)
app.get("/api/products", (req, res) => {
  const data = loadData();
  products = data.products;
  orders = data.orders;
  res.json(products);
});

// Tambah produk baru
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

  products.push(newProduct);
  saveData({ products, orders });

  res.status(201).json({
    success: true,
    message: "Produk berhasil ditambahkan!",
    data: newProduct,
  });
});

// Edit produk
app.put("/api/products/:id", (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Produk tidak ditemukan" });

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

  products[index] = { ...products[index], ...updatedData };
  saveData({ products, orders });

  res.json({
    success: true,
    message: "Produk berhasil diperbarui.",
    data: products[index],
  });
});

// Hapus produk
app.delete("/api/products/:id", (req, res) => {
  products = products.filter((p) => p.id !== req.params.id);
  saveData({ products, orders });
  res.status(204).send();
});

// ===== API ORDERS =====

// Ambil semua pesanan
app.get("/api/orders", (req, res) => {
  const data = loadData();
  products = data.products;
  orders = data.orders;
  res.json(orders);
});

// Tambah pesanan baru
app.post("/api/orders", (req, res) => {
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
    status: "Pending",
    createdAt: new Date(),
  };
  orders.push(newOrder);
  saveData({ products, orders });
  res.status(201).json({ message: "Pesanan berhasil dibuat", order: newOrder });
});

// Ubah status pesanan
app.put("/api/orders/:id/status", (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
  order.status = req.body.status;
  saveData({ products, orders });
  res.json({ message: "Status pesanan diperbarui", order });
});

// ===== Jalankan Server =====
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
