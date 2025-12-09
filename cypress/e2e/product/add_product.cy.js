describe('Admin - Tambah Produk', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000');

    cy.get('#auth-button').click();
    cy.get('#username').type('admin');
    cy.get('#password').type('admin123');
    cy.get('#auth-submit-btn').click();
    cy.get('#message-confirm').click();
  });

  it('Admin berhasil menambah produk', () => {

    // buka form tambah produk
    cy.contains('Tambah Produk Baru').click();

    // pastikan form tampil
    cy.get('#admin-form-container').should('be.visible');

    // isi form
    cy.get('#product-name').should('be.visible')
      .type('Tas Kulit Premium');

    cy.get('#product-category').select('Aksesoris');
    cy.get('#product-price').type('350000');
    cy.get('#product-imageurl').type('https://placehold.co/400');
    cy.get('#product-description').type('Handmade kualitas premium');

    // submit
    cy.get('#admin-form-submit-btn').click();

    // validasi popup
    cy.contains('Sukses').should('exist');
    cy.get('#message-confirm').click();

    // validasi masuk ke list produk
    cy.contains('Tas Kulit Premium').should('exist');

  });

});
