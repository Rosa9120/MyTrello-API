exports.up = function(knex) {
    return knex.schema
      .createTable('tableros', function (table) {
        table.increments('id').primary();
        table.string('nombre', 255).notNullable();
        table.integer("user_id").unsigned();
        table.string('descripcion', 255);
        table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTable('tableros');
  };
