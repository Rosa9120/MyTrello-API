exports.up = function(knex) {
    return knex.schema
      .createTable('etiquetas_tarjetas', function (table) {
        table.increments('id').primary();
        table.integer("etiqueta_id").unsigned();
        table.foreign("etiqueta_id").references("id").inTable("etiquetas").onDelete("CASCADE");
        table.integer('tarjeta_id').unsigned();
        table.foreign("tarjeta_id").references("id").inTable("tarjetas").onDelete("CASCADE");
        table.timestamps();
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTable('etiquetas_tarjetas');
  };
