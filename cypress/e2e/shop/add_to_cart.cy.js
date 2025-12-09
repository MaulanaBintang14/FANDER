describe('User - Tambah ke Keranjang', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.get('#auth-button').click();
    cy.get('#username').type('userbaru');
    cy.get('#password').type('password123');
    cy.get('#auth-submit-btn').click();
    cy.get('#message-confirm').click();
  });

  it('User menambahkan produk ke cart', () => {
   cy.contains('Tambah ke Keranjang').first().click();
cy.contains('Berhasil').should('exist');
cy.get('#message-confirm').click();

  });

});
