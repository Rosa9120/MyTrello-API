exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('tarjetas').del()
      .then(function () {
        // Inserts seed entries
        return knex('tarjetas').insert([
          {id: 1, nombre: 'Acabar documentación', descripcion: 'Acabar la documentación de la app en formato markdown y subirlo al repositorio', fechaVencimiento: '17-11-2022', columna_id: 1, asignadoA: 1},
        ]);
      });
  };