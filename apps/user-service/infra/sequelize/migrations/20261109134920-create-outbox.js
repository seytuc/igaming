'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('outbox', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      event: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      request_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      available_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('outbox', ['available_at', 'id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('outbox');
  },
};
