describe('User - Checkout COD', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.get('#auth-button').click();
    cy.get('#username').type('userbaru');
    cy.get('#password').type('password123');
    cy.get('#auth-submit-btn').click();
    cy.get('#message-confirm').click();

    cy.contains('Tambah ke Keranjang').first().click();
    cy.get('#message-confirm').click();

    cy.get('#cart-button').click();
  });

  it('User checkout dengan COD', () => {
    cy.contains('Checkout').click();

    cy.contains('Order Berhasil').should('exist');
    cy.get('#message-confirm').click();
  });

});
