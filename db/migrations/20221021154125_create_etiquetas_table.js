exports.up = function(knex) {
    return knex.schema
      .createTable('etiquetas', function (table) {
        table.increments('id').primary();
        table.string('nombre', 255).notNullable();
        table.integer("tablero_id").unsigned();
        table.foreign("tablero_id").references("id").inTable("tableros").onDelete("CASCADE");
        table.timestamps();
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTable('columnas');
  };
