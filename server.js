import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Middleware dasar =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // supaya bisa buka index.html langsung

// ===== Hilangkan error Chrome DevTools CSP =====
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(204).send(); // No Content
});

// ===== Data Sementara (dummy) =====
let products = [
  {
    id: "1",
    name: "Tas Selempang Pria",
    price: 550000,
    category: "Tas",
    description: "Tas kulit selempang pria elegan dan fungsional.",
    imageUrl: "https://placehold.co/400x300?text=Tas+Selempang",
  },
  {
    id: "2",
    name: "Dompet Kulit Premium",
    price: 350000,
    category: "Aksesoris",
    description: "Dompet kulit sapi asli premium dengan desain minimalis.",
    imageUrl: "https://placehold.co/400x300?text=Dompet+Kulit",
  },
];

let orders = [];

// ===== ROUTE UTAMA =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===== API AUTH =====
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    return res.json({
      token: "fake-admin-token",
      isAdmin: true,
      username,
    });
  } else {
    return res.json({
      token: "fake-user-token",
      isAdmin: false,
      username,
    });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { username } = req.body;
  res.json({ message: `Akun ${username} berhasil didaftarkan!` });
});

// ===== API PRODUCTS =====

// 🔹 GET Semua Produk
app.get("/api/products", (req, res) => {
  res.json(products);
});

// 🔹 GET Produk by ID
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });
  res.json(product);
});

// 🔹 POST Tambah Produk (validasi harga 10.000 - 10.000.000)
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
  res.status(201).json({
    success: true,
    message: "Produk berhasil ditambahkan!",
    data: newProduct,
  });
});

// 🔹 PUT Edit Produk (validasi harga juga)
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
  res.json({
    success: true,
    message: "Produk berhasil diperbarui.",
    data: products[index],
  });
});

// 🔹 DELETE Produk
app.delete("/api/products/:id", (req, res) => {
  products = products.filter((p) => p.id !== req.params.id);
  res.status(204).send();
});

// ===== API ORDERS =====
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
    status: "Pending",
    createdAt: new Date(),
  };
  orders.push(newOrder);
  res.status(201).json({ message: "Pesanan berhasil dibuat", order: newOrder });
});

app.put("/api/orders/:id/status", (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
  order.status = req.body.status;
  res.json({ message: "Status pesanan diperbarui", order });
});

// ===== Jalankan Server =====
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
