exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('columnas').del()
      .then(function () {
        // Inserts seed entries
        return knex('columnas').insert([
          {id: 1, titulo: 'Backlog', tablero_id: 1},
          {id: 2, titulo: 'in progress', tablero_id: 1},
          {id: 3, titulo: 'Done', tablero_id: 1},
          {id: 4, titulo: 'Backlog', tablero_id: 2},
        ]);
      });
  };