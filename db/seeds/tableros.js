exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('tableros').del()
    .then(function () {
      // Inserts seed entries
      return knex('tableros').insert([
        {id: 1, nombre: 'TAES', user_id: 1},
        {id: 2, nombre: 'GCS', user_id: 2},
      ]);
    });
};