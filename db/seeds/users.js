exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {id: 1, name: 'rosa', email: 'rosa@ua.es',password:'123'},
        {id: 2, name: 'ilyan', email: 'ilyan@ua.es',password:'123'},
        {id: 3, name: 'vicente', email: 'vicente@ua.es',password:'123'}
      ]);
    });
};