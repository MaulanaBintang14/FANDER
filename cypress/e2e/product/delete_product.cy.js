describe('Admin - Hapus Produk', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.get('#auth-button').click();
    cy.get('#username').type('admin');
    cy.get('#password').type('admin123');
    cy.get('#auth-submit-btn').click();
    cy.get('#message-confirm').click();
  });

  it('Admin berhasil menghapus produk', () => {

cy.contains('Hapus').first().click();

cy.contains('Sukses').should('exist');
cy.get('#message-confirm').click();

  });

});
