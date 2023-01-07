exports.up = async function (knex) {
    await knex.schema.table("tableros", (table) => {
    table.string("descripcion", 255);
  });
};

exports.down = async function (knex) {
    await knex.schema.table("tableros", (table) => {
    table.dropColumn("descripcion");
  });
};