describe('Login Test', () => {

  it('User bisa login sebagai admin', () => {
    cy.visit('http://localhost:3000');

    cy.get('#auth-button').click();
    cy.get('#username').type('admin');
    cy.get('#password').type('admin123');
    cy.get('#auth-submit-btn').click();

    cy.get('#message-confirm').click();
    cy.contains('Admin Dashboard').should('exist');
  });

});
