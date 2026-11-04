'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn('users', 'createdAt', 'created_at');
    await queryInterface.renameColumn('users', 'updatedAt', 'updated_at');
    await queryInterface.renameColumn('users', 'deletedAt', 'deleted_at');
  },

  async down(queryInterface) {
    await queryInterface.renameColumn('users', 'created_at', 'createdAt');
    await queryInterface.renameColumn('users', 'updated_at', 'updatedAt');
    await queryInterface.renameColumn('users', 'deleted_at', 'deletedAt');
  },
};
