exports.seed = function(knex) {
    // Deletes ALL existing entries
    return knex('tarjetas').del()
      .then(function () {
        // Inserts seed entries
        return knex('tarjetas').insert([
          {id: 1, nombre: 'Acabar documentación', descripcion: 'Acabar la documentación de la app en formato markdown y subirlo al repositorio', fechaVencimiento: '17-11-2022', columna_id: 1, asignadoA: 1},
          {id: 2, nombre: 'Funcionalidad de crear perfil', descripcion: 'Un usuario puede crearse un perfil y editar su foto y nombre', fechaVencimiento: '10-01-2023', columna_id: 1, asignadoA: 1},
          {id: 3, nombre: 'Prototype testing', descripcion: 'Darle a los clientes una beta de un prototipo funcional para que vayan probando la aplicacion', fechaVencimiento: '20-12-2022', columna_id: 2, asignadoA: 1},
          {id: 4, nombre: 'Diseño de arquitectura', descripcion: 'Diseñar la arquitectura que va a usar la aplicacion (tecnologias, hosting, etc)', fechaVencimiento: '10-11-2022', columna_id: 3, asignadoA: 1},
          {id: 5, nombre: 'Terminar especificaciones del cliente', descripcion: 'Hablar con el cliente y realizar un analisis de la especificacion del dominio del proyecto', fechaVencimiento: '08-10-2022', columna_id: 3, asignadoA: 1},
        ]);
      });
  };