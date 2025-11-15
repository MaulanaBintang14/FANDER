// Salin semua kode ini ke admin.test.js

const request = require('supertest');
const API_BASE = 'http://localhost:3000'; // Pastikan port 3000 sesuai dengan server.js

describe('API Auth Tests', () => {

  // Catatan: Pastikan server.js Anda sedang berjalan (npm start) 
  // di terminal LAIN sebelum Anda menjalankan 'npm test'
  
  test('POST /api/auth/login - harus berhasil login sebagai ADMIN', async () => {
    const response = await request(API_BASE)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123' // Sesuai kode Anda 
      });
    
    // Harapannya: Status sukses (200)
    expect(response.statusCode).toBe(200);
    // Harapannya: Mendapat token dan status isAdmin [cite: 1801, 1803]
    expect(response.body.isAdmin).toBe(true);
    expect(response.body.token).toBe('fake-admin-token');
  });

  test('POST /api/auth/login - harus berhasil login sebagai USER BIASA', async () => {
    const response = await request(API_BASE)
      .post('/api/auth/login')
      .send({
        username: 'budi', // Username bebas [cite: 1806]
        password: 'passwordasal'
      });
    
    // Harapannya: Status sukses (200)
    expect(response.statusCode).toBe(200);
    // Harapannya: Mendapat status BUKAN admin [cite: 1811]
    expect(response.body.isAdmin).toBe(false);
    expect(response.body.username).toBe('budi');
  });
});