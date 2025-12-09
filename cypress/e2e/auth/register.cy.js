describe('Register Test', () => {

  it('User berhasil registrasi', () => {
    cy.visit('http://localhost:3000');

    cy.get('#auth-button').click();
    cy.contains('Daftar di sini').click();

    cy.get('#username').type('userbaru');
    cy.get('#password').type('password123');

    cy.get('#auth-submit-btn').click();
    cy.get('#message-confirm').click();

    cy.contains('Produk').should('exist');
  });

});
