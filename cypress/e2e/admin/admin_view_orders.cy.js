describe('Admin - Lihat Daftar Pesanan', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.get('#auth-button').click();
    cy.get('#username').type('admin');
    cy.get('#password').type('admin123');
    cy.get('#auth-submit-btn').click();
    cy.get('#message-confirm').click();
  });

  it('Admin melihat daftar order', () => {
    cy.contains('Daftar Pesanan').click();

    cy.contains('Order ID').should('exist');
    cy.contains('Status').should('exist');
  });

});
