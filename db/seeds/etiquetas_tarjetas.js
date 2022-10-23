//hay que comprobar que la etiqueta existe en el tablero de la tarjeta
//en la aplicación real la etiqueta de la tarjeta se eligirá de un desplegable que mostrará sólo las etiquetas de ese tablero
exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('etiquetas_tarjetas').del()
      .then(function () {
        // Inserts seed entries
        return knex('etiquetas_tarjetas').insert([
          {id: 1, etiqueta_id: 1, tarjeta_id: 1},
          {id: 2, etiqueta_id: 2, tarjeta_id: 1}
        ]);
      });
  };