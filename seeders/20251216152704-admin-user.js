'use strict';

const { hashPassword } = require('../utils/hashPass');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await hashPassword('admin123');

    console.log('Current Database:', queryInterface.sequelize.config.database);
    const [results] = await queryInterface.sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public'"
    );
    console.log('Tables in DB:', results.map(r => r.tablename));

    await queryInterface.sequelize.query(`
      INSERT INTO usuario (usuario, nombre, contrasena, rol, "createdAt", "updatedAt")
      VALUES ('admin', 'Administrador', '${hashedPassword}', 'admin', NOW(), NOW())
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuario', { usuario: 'admin' }, {});
  }
};
