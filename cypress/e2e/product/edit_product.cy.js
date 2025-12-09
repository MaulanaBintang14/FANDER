describe('Admin - Edit Produk', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.get('#auth-button').click();
    cy.get('#username').type('admin');
    cy.get('#password').type('admin123');
    cy.get('#auth-submit-btn').click();
    cy.get('#message-confirm').click();
  });

  it('Admin berhasil mengedit produk', () => {
cy.contains('Edit').first().click();

cy.get('#admin-form-container').should('be.visible');

cy.get('#product-name')
  .clear()
  .type('Tas Kulit Premium (Update)');

cy.get('#admin-form-submit-btn').click();

cy.contains('Sukses').should('exist');
cy.get('#message-confirm').click();

  });

});
