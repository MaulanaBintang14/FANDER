const request = require('supertest');
const API_BASE = 'http://localhost:3000';

// Variabel untuk menyimpan data antar tes
let newProductId = '';
let newOrderId = '';

// ===================================
// KELOMPOK TES 1: AUTENTIKASI
// ===================================
describe('Fitur 1: API Auth (/api/auth)', () => {
  
  test('POST /api/auth/login - harus berhasil login sebagai ADMIN', async () => {
    const res = await request(API_BASE).post('/api/auth/login').send({
      username: 'admin',
      password: 'admin123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.isAdmin).toBe(true);
  });

  test('POST /api/auth/login - harus berhasil login sebagai USER BIASA', async () => {
    const res = await request(API_BASE).post('/api/auth/login').send({
      username: 'budi',
      password: 'budipass'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.isAdmin).toBe(false);
  });

  test('POST /api/auth/login - harus GAGAL jika data tidak lengkap', async () => {
    const res = await request(API_BASE).post('/api/auth/login').send({ username: 'admin' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Username dan password wajib diisi.');
  });
  
  test('POST /api/auth/register - harus berhasil mendaftar user baru', async () => {
    const res = await request(API_BASE).post('/api/auth/register').send({
      username: 'userbaru',
      password: 'passwordbaru'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('berhasil didaftarkan');
  });
});

// ===================================
// KELOMPOK TES 2: MANAJEMEN PRODUK (CRUD)
// ===================================
describe('Fitur 2: API Products CRUD (/api/products)', () => {

  test('POST /api/products - harus berhasil MENAMBAH produk baru', async () => {
    const res = await request(API_BASE).post('/api/products').send({
      name: 'Tas Kulit Super',
      category: 'Tas',
      price: 500000,
      description: 'Tas kulit asli',
      imageUrl: 'http://gambar.com/tas.jpg'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Produk berhasil ditambahkan!');
    newProductId = res.body.data.id; // Simpan ID untuk tes selanjutnya
  });

  test('POST /api/products - harus GAGAL jika harga tidak valid', async () => {
    const res = await request(API_BASE).post('/api/products').send({
      name: 'Produk Gagal',
      category: 'Tas',
      price: 5000 // Harga di bawah 10.000
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Harga harus antara Rp 10.000 dan Rp 10.000.000.');
  });

  test('GET /api/products - harus berhasil MENDAPATKAN semua produk', async () => {
    const res = await request(API_BASE).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('PUT /api/products/:id - harus berhasil MENGUPDATE produk', async () => {
    const res = await request(API_BASE).put(`/api/products/${newProductId}`).send({
      name: 'Tas Kulit Super (Updated)',
      price: 550000
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Produk berhasil diperbarui.');
    expect(res.body.data.name).toBe('Tas Kulit Super (Updated)');
  });

  test('DELETE /api/products/:id - harus berhasil MENGHAPUS produk', async () => {
    const res = await request(API_BASE).delete(`/api/products/${newProductId}`);
    expect(res.statusCode).toBe(204); // 204 No Content adalah respons sukses untuk DELETE
  });
});

// ===================================
// KELOMPOK TES 3: MANAJEMEN PESANAN (ORDERS)
// ===================================
describe('Fitur 3: API Orders (/api/orders)', () => {

  test('POST /api/orders - harus berhasil MEMBUAT pesanan baru', async () => {
    const res = await request(API_BASE).post('/api/orders').send({
      productId: '12345',
      buyerName: 'Budi Santoso',
      buyerPhone: '08123456789',
      buyerAddress: 'Jl. Merdeka No. 10'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Pesanan berhasil dibuat');
    newOrderId = res.body.order.id; // Simpan ID untuk tes selanjutnya
  });

  test('GET /api/orders - harus berhasil MENDAPATKAN semua pesanan (Admin)', async () => {
    const res = await request(API_BASE).get('/api/orders');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('PUT /api/orders/:id/status - harus berhasil MENGUPDATE status pesanan (Admin)', async () => {
    const res = await request(API_BASE).put(`/api/orders/${newOrderId}/status`).send({
      status: 'Shipped'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Status pesanan diperbarui');
    expect(res.body.order.status).toBe('Shipped');
  });
});