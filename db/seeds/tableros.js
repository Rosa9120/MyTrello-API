exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('tableros').del()
    .then(function () {
      // Inserts seed entries
      return knex('tableros').insert([
        {id: 1, nombre: 'TAES', user_id: 1, descripcion: 'Tablero de la asignatura de Tecnologías Avanzadas de la Escuela Superior de Ingeniería Informática de la Universidad de Sevilla'},
        {id: 2, nombre: 'GCS', user_id: 2},
      ]);
    });
};