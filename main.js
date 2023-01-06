var express = require('express');
var jwt = require('jwt-simple')
var moment = require('moment')
var multer = require('multer')
var path = require('path');
var cors = require('cors')
const knexConfig = require('./db/knexfile');
const knex = require('knex')(knexConfig.development.connection.filename)
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/db.sqlite3');

var app = express();
app.use(express.json())

app.use(cors({
    origin: '*'
}));


const upload = multer({ dest: 'uploads/' })

var secret = 'secreto'

app.post('/tableros/:id/background', chequeaJWT, (pet, res) => {
    upload.single("imagen")(pet, res, function (err) { // La imagen la guarda en formato base64, es por eso que no podemos previsualizarla
        console.log(pet.file) // Si imprimimos pet.file, podemos ver que nos devuelve un objeto con la informacion de la imagen, como el nombre, el path, el mimetype (en el ejemplo sale image/jpeg), etc.
        res.header('Access-Control-Allow-Origin', "*")
        res.send({ mensaje: "Archivo insertado correctamente" })
    })
})

//En una app con autentificación basada en Token, el login genera y devuelve el token
app.post('/login', function(pet, resp){
    var loginBuscado = pet.body.login
    var passwordBuscado = pet.body.password

    knex('users')
    .select({
        id: 'id',
        name: 'name',
        email: 'email'
    }).where({
        email: loginBuscado,
        password:  passwordBuscado
    })
    .then((user) => {
        if (user.length > 0) {
            user = user[0]
            var payload = {
                id: user.id,
                login: user.email,
                exp: moment().add(7, 'days').valueOf()
            }
            token = jwt.encode(payload, secret)
            resp.header('Access-Control-Allow-Origin', "*")
            resp.send({token: token, mensaje:"OK"})
        } else {
            resp.status(403)
            resp.header('Access-Control-Allow-Origin', "*")
            resp.send({mensaje:"NO OK"})
        }
    })

})


function getTokenFromAuthHeader(pet) {
    var cabecera = pet.header('Authorization')
    if (cabecera) {
        var campos = cabecera.split(' ')
        if (campos.length>1 && cabecera.startsWith('Bearer')) {
            return campos[1] 
        }
    }
    return undefined
}

//MIDDLEWARE
function chequeaJWT(pet, resp, next) {

    var token = getTokenFromAuthHeader(pet)
    var validToken = false

    try {
        jwt.decode(token, secret)
        validToken = true
    } catch {}

    if (validToken) {
        //Al llamar a next, el middleware "deja pasar" a la petición
        next()      
    }
    else {
        resp.status(403)
        resp.header('Access-Control-Allow-Origin', "*")
        resp.send({mensaje: "No tienes permisos"})
    }
}

//get de una coleccion
app.get('/tableros', function(pet, res) {

    var offset = pet.query.offset !== undefined && !isNaN(pet.query.offset) && parseInt(pet.query.offset) >= 0 ? parseInt(pet.query.offset) : 0; // Por defecto el offset sera 0
    var limit = pet.query.limit !== undefined && !isNaN(pet.query.limit) && parseInt(pet.query.limit) >= 0 ? parseInt(pet.query.limit) : 10; // Por defecto el limite sera 10

    let sql = `SELECT id, nombre, user_id
    FROM tableros LIMIT ? OFFSET ?`;

    let sqlCount = `SELECT id
    FROM tableros`;

    db.all(sql, [limit, offset], (err, rows) => {
        if (err || rows == null) {
            res.status(404)  
            res.header('Access-Control-Allow-Origin', "*")
            res.send({cod:404, mensaje:"El item no existe"})
        } else{
            db.all(sqlCount, (err, rowsCount) => {
                res.header('Access-Control-Allow-Origin', "*")
                res.send({
                    tableros: Array.from(rows.values()),
                    offset: offset,
                    limit: limit,
                    total: rowsCount.length,
                    count: rows.length,
                    next_page: rows.length === limit ? "http://localhost:3000/tableros?offset=" + (offset + limit) + "&limit=" + limit : null,
                    prev_page: offset > 0 ? "http://localhost:3000/tableros?offset=" + ((offset - limit) < 0 ? 0 : (offset - limit)) + "&limit=" + limit : null
                })
            })
        }
    });
})

//get de un recurso sabiendo su id
app.get('/tableros/:id', function(pet,res){

    var id = parseInt(pet.params.id)
    
    if (isNaN(id)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }
    else{
        let sql = `SELECT id, nombre, user_id
           FROM tableros
           WHERE id  = ?`;

        db.get(sql, [id], (err, row) => {
            if (err || row == null) {
                res.status(404) 
                res.header('Access-Control-Allow-Origin', "*") 
                res.send({cod:404, mensaje:"El item no existe"})
            }
            else {
                res.header('Access-Control-Allow-Origin', "*")
                res.send({tablero: row})
            }
        });
    }
    
})


//get las columnas de un tablero
app.get('/tableros/:id/columnas', function(pet,res){

    var idtablero = parseInt(pet.params.id)
    
    if (isNaN(idtablero)){
        res.status(400)
        res.send({cod:400, mensaje:"El item no es un numero"})
    }
    else{

        let sql = `SELECT id, nombre, user_id
        FROM tableros
        WHERE id  = ?`

        db.get(sql, idtablero, (err, row) => {
        if (err || row == null) {
            res.status(404)  
            res.send({cod:404, mensaje:"El tablero no existe"})
        }
        else{

            let sql2 = `SELECT id, titulo
            FROM columnas WHERE
            tablero_id = ?`;
            db.all(sql2, idtablero, (err, rows) => {
                if (err || rows == null) {
                    res.status(404)  
                    res.send({cod:404, mensaje:"El tablero no tiene columnas"})
                }
                else{
                    res.send({columnas: Array.from(rows.values())})
                }
            })
        }
        });
    }
    
})

//post
app.post('/tableros', chequeaJWT, function(pet, resp){

    var token = getTokenFromAuthHeader(pet)
    
    payload = jwt.decode(token, secret)

    paramString = "null, '" + pet.body.nombre + "', " + payload.id;

    //creadoPor = payload.login

    let sql = 'INSERT into tableros (id, nombre, user_id) VALUES (' + paramString + ')';

    db.run(sql, function(err) {
        console.log(this)
        if(err){
            resp.status(500)
            res.header('Access-Control-Allow-Origin', "*")
            resp.send({cod:500, mensaje:"No se ha podido insertar"})
        }
        else{
            resp.header('Location', 'http://localhost:3000/tableros/' + this.lastID)
            res.header('Access-Control-Allow-Origin', "*")
            resp.send({mensaje:"OK"})  
        }

    });
})

//delete
app.delete('/tableros/:id', chequeaJWT, function(pet,res){
    var id = parseInt(pet.params.id)
    

    if (isNaN(id)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }
    else{
        
        let sql = `SELECT id, nombre, user_id
            FROM tableros
            WHERE id  = ?`;

        db.get(sql, [id], (err, row) => {
            if (err || row == null) {
                res.status(404)  
                res.header('Access-Control-Allow-Origin', "*")
                res.send({cod:404, mensaje:"El item no existe"})
            }
            else {
                let sql2 = `DELETE FROM tableros WHERE id = ?`;
                db.run(sql2, [id], (err, row) => {
                    if (err) {
                        res.status(500)  
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({cod:404, mensaje:"No se ha podido borrar"})
                    }
                    else {
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({tablero: row})
                    }
                });
            }
        });
    }

})


// get de columnas de un tablero
app.get('/tableros/:id/columnas', function(pet, res) {
    
    var id = parseInt(pet.params.id)
    
    if (isNaN(id)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El id no es un numero"})
    }
    else{
        let sql = `SELECT id, titulo
        FROM columnas
        WHERE tablero_id = ?`;

        db.all(sql, [id], (err, rows) => { 
            if (err || rows == null) {
                res.status(404)  
                res.header('Access-Control-Allow-Origin', "*")
                res.send({cod:404, mensaje:"El item no existe"})
            }
            else {
                res.header('Access-Control-Allow-Origin', "*")
                res.send({columnas: rows})
            }
        });
    }
})

//get de una columna sabiendo su id
app.get('/tableros/:idtablero/columnas/:idcolumna', function(pet,res){

    var idtablero = parseInt(pet.params.idtablero)
    var idcolumna = parseInt(pet.params.idcolumna)
    
    if (isNaN(idcolumna) || isNaN(idtablero)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El id no es un numero"})
    }
    else {
        let sql = `SELECT id, titulo
           FROM columnas
           WHERE id  = ? and tablero_id = ?`;

        db.get(sql, [idcolumna, idtablero], (err, row) => {
            if (err || row == null) {
                res.status(404)  
                res.header('Access-Control-Allow-Origin', "*")
                res.send({cod:404, mensaje:"La columna no existe"})
            }
            else {
                res.header('Access-Control-Allow-Origin', "*")
                res.send({columna: row})
            }
        });
    }
})

//get de tarjetas de una columna

app.get('/tableros/:idtablero/columnas/:idcolumna/tarjetas', function(pet, res) {
        
        var idtablero = parseInt(pet.params.idtablero)
        var idcolumna = parseInt(pet.params.idcolumna)
        
        if (isNaN(idcolumna) || isNaN(idtablero)){
            res.status(400)
            res.header('Access-Control-Allow-Origin', "*")
            res.send({cod:400, mensaje:"El id no es un numero"})
        }
        else{
            let sql = `SELECT id, nombre, descripcion, columna_id, fechaVencimiento
            FROM tarjetas
            WHERE columna_id = ?`;
    
            db.all(sql, [idcolumna], (err, rows) => {
                if (err || rows == null) {
                    res.status(404)  
                    res.header('Access-Control-Allow-Origin', "*")
                    res.send({cod:404, mensaje:"El item no existe"})
                }
                else {
                    res.header('Access-Control-Allow-Origin', "*")
                    res.send({tarjetas: rows})
                }
            }
            );
        }
})

//get de una tarjeta sabiendo su id
app.get('/tableros/:idtablero/columnas/:idcolumna/tarjetas/:idtarjeta', function(pet,res){

    var idtablero = parseInt(pet.params.idtablero)
    var idcolumna = parseInt(pet.params.idcolumna)
    var idtarjeta = parseInt(pet.params.idtarjeta)

    
    if (isNaN(idcolumna) || isNaN(idtablero) || isNaN(idtarjeta)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El id no es un numero"})
    }
    else {
        let sql = `SELECT *
           FROM tarjetas
           WHERE id  = ? and columna_id = ?`;

        db.get(sql, [idtarjeta, idcolumna], (err, row) => {
            if (err || row == null) {
                res.status(404)  
                res.header('Access-Control-Allow-Origin', "*")
                res.send({cod:404, mensaje:"La tarjeta no existe"})
            }
            else {
                res.header('Access-Control-Allow-Origin', "*")
                res.send({columna: row})
            }
        });
    }

})

//get las tarjetas de una columna
app.get('/tableros/:idtablero/columnas/:idcolumna/tarjetas', function(pet,res){
    var idtablero = parseInt(pet.params.idtablero)
    var idcolumna = parseInt(pet.params.idcolumna)

    if (isNaN(idcolumna) || isNaN(idtablero)){
        res.status(400)
        res.send({cod:400, mensaje:"El id no es un numero"})
    }
    else{
        let sql = `SELECT *
           FROM columnas
           WHERE id = ? and tablero_id = ?`;

        db.get(sql, [idcolumna, idtablero], (err, row) => {
        if (err || row == null) {
            res.status(404)  
            res.send({cod:404, mensaje:"La columna no existe"})
        }
        else{
            let sql2 = `SELECT id, nombre
            FROM tarjetas WHERE
            columna_id = ?`;
            db.all(sql2, idtablero, (err, rows) => {
                if (err || rows == null) {
                    res.status(404)  
                    res.send({cod:404, mensaje:"El tablero no tiene columnas"})
                }
                else{
                    res.send({tarjetas: Array.from(rows.values())})
                }
            })
        }
        })
    }
})

// update de una tarjeta

app.put('/tableros/:idtablero/columnas/:idcolumna/tarjetas/:idtarjeta', function(pet,res){ // TODO comprobar que esta logueado
    var idtablero = parseInt(pet.params.idtablero)
    var idcolumna = parseInt(pet.params.idcolumna)
    var idtarjeta = parseInt(pet.params.idtarjeta)
    var nombre = pet.body.nombre
    var descripcion = pet.body.descripcion
    var fechaVencimiento = pet.body.fechaVencimiento

    if (isNaN(idcolumna) || isNaN(idtablero) || isNaN(idtarjeta)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }

    else{
        
        let sql = `SELECT id, columna_id
            FROM tarjetas
            WHERE id = ? and columna_id = ?`;

        db.get(sql, [idtarjeta, idcolumna], (err, row) => {
            console.log(sql);

            if (err || row == null) {
                res.status(404) 
                res.header('Access-Control-Allow-Origin', "*") 
                res.send({cod:404, mensaje:"El item no existe"})
            }
            else{
                let sql2 = `UPDATE tarjetas SET nombre = ?, descripcion = ?, fechaVencimiento = ? WHERE id = ?`;
                console.log(sql2);
                
                db.run(sql2, [nombre, descripcion, fechaVencimiento, idtarjeta], (err, row) => {
                console.log(row);
                if (err) {
                    res.status(500)  
                    res.header('Access-Control-Allow-Origin', "*")
                    res.send({cod:404, mensaje:"No se ha podido actualizar"})
                }
                else{
                    //hago select del recurso actualizado para poder devolverlo
                    let sql = `SELECT * FROM tarjetas WHERE id = ? and columna_id = ?`;
                    db.get(sql, [idtarjeta, idcolumna], (err, row) => {
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({tarjeta: row})
                    })
                }
                });
            }   
        });
    }
})

//patch: cambiar tarjeta de columna 
app.patch('/tableros/:idtablero/columnas/:idcolumna/tarjetas/:idtarjeta', function(pet,res){ // TODO comprobar que esta logueado
    //comprobar que la columna nueva exista 
    var idtablero = parseInt(pet.params.idtablero)
    var idcolumna = parseInt(pet.params.idcolumna)
    var idtarjeta = parseInt(pet.params.idtarjeta)
    var columnanueva = pet.body.columna

    if (isNaN(idcolumna) || isNaN(idtablero) || isNaN(idtarjeta) || isNaN(columnanueva)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }

    else{
        
        let sql = `SELECT id, columna_id
            FROM tarjetas
            WHERE id = ? and columna_id = ?`;

        db.get(sql, [idtarjeta, idcolumna], (err, row) => {
            console.log(sql);

            if (err || row == null) {
                res.status(404) 
                res.header('Access-Control-Allow-Origin', "*") 
                res.send({cod:404, mensaje:"El item no existe"})
            }
            else{
                let sql2 = `UPDATE tarjetas SET columna_id = ? WHERE id = ?`;
                console.log(sql2);
                
                db.run(sql2, [columnanueva, idtarjeta], (err, row) => {
                console.log(row);
                if (err) {
                    res.status(500)  
                    res.header('Access-Control-Allow-Origin', "*")
                    res.send({cod:404, mensaje:"No se ha podido actualizar"})
                }
                else{
                    //hago select del recurso actualizado para poder devolverlo
                    let sql = `SELECT * FROM tarjetas WHERE id = ? and columna_id = ?`;
                    db.get(sql, [idtarjeta, columnanueva], (err, row) => {
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({tarjeta: row})
                    })
                }
                });
            }   
        });
    }
})

//put: cambiar nombre del tablero
app.put('/tableros/:idtablero', chequeaJWT, function(pet,res){

    var idtablero = parseInt(pet.params.idtablero)

    if (isNaN(idtablero)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }

    if (pet.body.user_id !== undefined && isNaN(pet.body.user_id)){
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }

    else{
        let sql = `SELECT *
            FROM tableros
            WHERE id = ?`;

        db.get(sql, [idtablero], (err, row) => {

            if (err || row == null) {
                res.status(404)  
                res.header('Access-Control-Allow-Origin', "*")
                res.send({cod:404, mensaje:"El tablero no existe"})
            }
            else {
                
                let sql2 = `UPDATE tableros SET nombre = ?, user_id = ? WHERE id = ?`;
                db.run(sql2, [pet.body.nombre !== undefined ? pet.body.nombre : row.nombre, pet.body.user_id !== undefined ? pet.body.user_id : row.user_id, idtablero], (err, row) => {
                if (err) {
                    res.status(500)  
                    res.header('Access-Control-Allow-Origin', "*")
                    res.send({cod:500, mensaje:"No se ha podido actualizar"})
                }
                else{
                    //hago select del recurso actualizado para poder devolverlo
                    let sql = `SELECT * FROM tableros WHERE id = ?`;
                    db.get(sql, [idtablero], (err, row) => {
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({tablero: row})
                    })
                }

                });
            }
        });
    }
})

// Post nueva tarjeta en columna
app.post('/tableros/:idtablero/columnas/:idcolumna/tarjetas', function(pet,res) { // TODO comprobar que esta logueado
    var idtablero = parseInt(pet.params.idtablero)
    var idcolumna = parseInt(pet.params.idcolumna)
    var nombre = pet.body.nombre

    if (isNaN(idcolumna) || isNaN(idtablero) || nombre == null) {
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }
    else { 
        let sql = `SELECT id
            FROM columnas
            WHERE id = ? and tablero_id = ?`;

        db.get(sql, [idcolumna, idtablero], (err, row) => {
            if (err || row == null) {
                res.status(404)
                res.header('Access-Control-Allow-Origin', "*")  
                res.send({cod:404, mensaje:"El item no existe"})
            }
            else {
                let sql2 = `INSERT INTO tarjetas (nombre, columna_id, descripcion, fechaVencimiento) VALUES (?, ?, ?, ?)`;
                const today = new Date();
                const yyyy = today.getFullYear();
                let mm = today.getMonth() + 1; // Months start at 0!
                let dd = today.getDate();

                if (dd < 10) dd = '0' + dd;
                if (mm < 10) mm = '0' + mm;

                const todayFormat = dd + '-' + mm + '-' + yyyy;
-
                db.run(sql2, [nombre, idcolumna, '', todayFormat], function(err, row) {
                    if (err) {
                        console.log(err)
                        res.status(500)
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({cod:500, mensaje:"No se ha podido insertar"})
                    }
                    else {
                        let sql3 = `SELECT * FROM tarjetas WHERE id = ?`;
                        db.get(sql3, [this.lastID], (err, row) => {
                            res.header('Access-Control-Allow-Origin', "*")
                            res.send({tarjeta: row})
                        })
                    }
                });
            }
        });
    }
})

// Post nueva columna en tablero

app.post('/tableros/:idtablero/columnas', function(pet,res) { // TODO comprobar que esta logueado
    var idtablero = parseInt(pet.params.idtablero)
    var titulo = pet.body.titulo

    if (isNaN(idtablero) || titulo == null) {
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El item no es un numero"})
    }
    else {
        let sql = `SELECT id
            FROM tableros
            WHERE id = ?`;

        db.get(sql, [idtablero], (err, row) => {
            if (err || row == null) {
                res.status(404)
                res.header('Access-Control-Allow-Origin', "*")
                res.send({cod:404, mensaje:"El item no existe"})
            }
            else {
                let sql2 = `INSERT INTO columnas (titulo, tablero_id) VALUES (?, ?)`;
                db.run(sql2, [titulo, idtablero], function(err, row) {
                    if (err) {
                        console.log(err)
                        res.status(500)
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({cod:500, mensaje:"No se ha podido insertar"})
                    }
                    else {
                        let sql3 = `SELECT * FROM columnas WHERE id = ?`;
                        db.get(sql3, [this.lastID], (err, row) => {
                            res.header('Access-Control-Allow-Origin', "*")
                            res.send({columna: row})
                        })
                    }
                });
            }
        });
    }
})

// Post registro nuevo usuario

app.post('/usuarios/', function(pet,res) { 
   
    paramString = "null, '" + pet.body.nombre + "', '" + pet.body.email + "', '" + pet.body.password + "'";

    //check length of password
    if (pet.body.password.length < 5) {
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"La contraseña debe tener al menos 5 caracteres"})
    }
    //check if email is valid
    else if (!validateEmail(pet.body.email)) {
        res.status(400)
        res.header('Access-Control-Allow-Origin', "*")
        res.send({cod:400, mensaje:"El email no es válido"})
    }
    else{
        let sql = 'SELECt * FROM users WHERE email = ?';
        let sql2 = 'INSERT into users (id, name, email, password) VALUES (' + paramString + ')';
    
        db.get(sql, [pet.body.email], (err, row) => {
            if (err || row == null) {
    
                db.run(sql2, function(err) {
                    console.log(this)
                    if(err){
                        console.log(err)
                        res.status(500)
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({cod:500, mensaje:"No se ha podido insertar"})
                    }
                    else{
                        res.header('Location', 'http://localhost:3000/tableros/' + this.lastID)  
                        res.header('Access-Control-Allow-Origin', "*")
                        res.send({mensaje:"Usuario creado correctamente"})  
                    }
                });
            }
            else {  
                res.header('Access-Control-Allow-Origin', "*")
                res.send({cod:400, mensaje:"El usuario ya existe"})
            }
        })
    
    }
    
})

//function validateEmail
function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}


var listener = app.listen(process.env.PORT||3000, () => {
    console.log(`Servidor en el puerto ${listener.address().port}`);
})
