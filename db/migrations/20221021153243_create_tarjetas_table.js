exports.up = function(knex) {
    return knex.schema
      .createTable('tarjetas', function (table) {
        table.increments('id').primary();
        table.string('nombre', 255).notNullable();
        table.string('descripcion', 255).notNullable();
        table.text('fechaVencimiento', 255).notNullable();
        table.integer("columna_id").unsigned();
        table.foreign("columna_id").references("id").inTable("columnas").onDelete("CASCADE");
        table.string('asignadoA');
        table.foreign("asignadoA").references("id").inTable("users");
        table.timestamps();
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTable('columnas');
  };
