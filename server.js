// ======================================================
// main.js - Frontend Logic for FANDER Leather Production
// ======================================================

// Base URL ke backend
const API_BASE = "http://localhost:3000/api";

// Auth & state global
const auth = { isAdmin: true, username: "Admin" };
let products = [];

// ======================================================
// ============ NAVIGASI & HALAMAN ADMIN ================
// ======================================================

// Fungsi navigasi antar halaman admin
function navigateAdmin(page) {
  document.querySelectorAll(".admin-section").forEach((s) =>
    s.classList.add("hidden")
  );

  if (page === "dashboard") {
    document.getElementById("admin-dashboard").classList.remove("hidden");
    renderAdminDashboard();
  } else if (page === "produk") {
    document.getElementById("admin-produk").classList.remove("hidden");
    renderAdminProductTable();
  } else if (page === "profile") {
    document.getElementById("admin-profile").classList.remove("hidden");
    renderProfileView();
  }
}

// Kembali ke Dashboard Admin
function goBackToAdminDashboard() {
  navigateAdmin("dashboard");
}

// ======================================================
// =============== RENDER DASHBOARD =====================
// ======================================================
function renderAdminDashboard() {
  document.getElementById("admin-username").textContent = auth.username;
  document.getElementById("total-products").textContent = products.length;
  document.getElementById("total-orders").textContent = 5; // contoh
}

// ======================================================
// =============== RENDER PRODUK (API) ==================
// ======================================================
async function renderAdminProductTable() {
  const tableBody = document.getElementById("admin-product-table-body");
  tableBody.innerHTML = `
    <tr><td colspan="4" class="p-4 text-center text-cyan-400 italic">
      <i class="fas fa-spinner fa-spin mr-2"></i>Memuat data produk...
    </td></tr>
  `;

  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    products = data;

    if (!products.length) {
      tableBody.innerHTML = `
        <tr><td colspan="4" class="p-4 text-center text-gray-400 italic">
          Belum ada produk terdaftar.
        </td></tr>
      `;
      return;
    }

    tableBody.innerHTML = products
      .map(
        (p) => `
        <tr class="hover:bg-gray-700 transition">
          <td class="p-3 text-gray-200">${p.name}</td>
          <td class="p-3 text-cyan-300 font-semibold">${formatRupiah(
            p.price
          )}</td>
          <td class="p-3 text-gray-400">${p.category}</td>
          <td class="p-3 text-right space-x-2">
            <button class="text-blue-400 hover:text-blue-500 text-sm">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="text-red-400 hover:text-red-500 text-sm">
              <i class="fas fa-trash"></i> Hapus
            </button>
          </td>
        </tr>`
      )
      .join("");
  } catch (err) {
    console.error("Gagal memuat produk:", err);
    tableBody.innerHTML = `
      <tr><td colspan="4" class="p-4 text-center text-red-400 italic">
        Gagal memuat data produk.
      </td></tr>
    `;
  }
}

// ======================================================
// =============== RENDER PROFILE =======================
// ======================================================
function renderProfileView() {
  document.getElementById("profile-username").textContent = auth.username;
  document.getElementById("profile-type").textContent = auth.isAdmin
    ? "Admin"
    : "User";
}

// ======================================================
// =============== UTILITAS UMUM ========================
// ======================================================
function formatRupiah(num) {
  return "Rp " + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function logout() {
  alert("Anda telah logout.");
}

// ======================================================
// =============== INISIALISASI AWAL ====================
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  renderAdminDashboard();
  renderAdminProductTable();
  navigateAdmin("dashboard");
});
