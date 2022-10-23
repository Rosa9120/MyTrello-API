exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('etiquetas').del()
      .then(function () {
        // Inserts seed entries
        return knex('etiquetas').insert([
          {id: 1, nombre: 'testing', tablero_id: 1},
          {id: 2, nombre: 'technical', tablero_id: 1},
          {id: 3, nombre: 'bug', tablero_id: 2}
        ]);
      });
  };