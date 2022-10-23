exports.up = function(knex) {
    return knex.schema
      .createTable('users', function (table) {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('email', 255).unique().notNullable();
        table.string('password', 255).notNullable();
        table.timestamps();
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTable('users');
  };
