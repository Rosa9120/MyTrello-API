// Hecho por Rosa Maria Rodriguez Lledo e Ilya Slyusarchuk Dimitriouchkina

var express = require('express')
var jwt = require('jwt-simple')
var moment = require('moment')

var app = express()
app.use(express.json())

var users = new Map()
users.set("pepe", {login:"pepe", password:"pepe"})
users.set("adi", {login:"adi", password:"adi"})

var secret = 'tontoelqueintentehackeareltoken'

//En una app con autentificación basada en Token, el login genera y devuelve el token
app.post('/miapi/login', function(pet, resp){
    var loginBuscado = pet.body.login
    var passwordBuscado = pet.body.password
    var user = users.get(loginBuscado)
    if (user && user.password==passwordBuscado) {
        var payload = {
            login: user.login,
            exp: moment().add(7, 'days').valueOf()
        }
        //TODO: cambiar esto por código que genere y envíe un JWT 
        //cuyo payload sea el nombre de usuario
        token = jwt.encode(payload, secret)
        resp.send({token: token, mensaje:"OK"})
    }
    else {
        resp.send(403).end()
    }
})

//Middleware: lo pondremos ANTES de procesar cualquier petición que requiera autentificación
function chequeaJWT(pet, resp, next) {

    var token = getTokenFromAuthHeader(pet)
    //TODO: si el token está en la petición (token!=undefined)
    //1. Comprobar si es correcto, con jwt-simple
    //2. Cambiar la condición del if para que sea true si lo es y falso si no
    var validToken = false

    try {
        jwt.decode(token, secret)
        validToken = true
    } catch {}

    if (validToken) {
        //Al llamar a next, el middleware "deja pasar" a la petición
        //llamando al siguiente middleware
        next()
    }
    else {
        resp.status(403)
        resp.send({mensaje: "no tienes permisos"})
    }
}

//Si en la petición HTTP "pet" existe una cabecera "Authorization"
//con el formato "Authorization: Bearer XXXXXX"  
//devuelve el XXXXXX (en JWT esto sería el token)
function getTokenFromAuthHeader(pet) {
    var cabecera = pet.header('Authorization')
    if (cabecera) {
        //Parte el string por el espacio. Si está, devolverá un array de 2
        //la 2ª pos será lo que hay detrás de "Bearer"
        var campos = cabecera.split(' ')
        if (campos.length>1 && cabecera.startsWith('Bearer')) {
            return campos[1] 
        }
    }
    return undefined
}

app.get('/', function(pet, resp) {
  resp.send('Esta es la raíz de la app')  
})

app.get('/miapi/saludo', function(pet, resp) {
  resp.send("hola soy el API, este es un recurso que no requiere autentificación")
})

app.get('/miapi/protegido1', chequeaJWT, function(pet, resp){
    //TODO: sacar el token de la cabecera, sacar el payload
    //y enviarlo en la respuesta, con un saludo "hola <login_del_usuario>"

    var token = getTokenFromAuthHeader(pet)
    
    payload = jwt.decode(token, secret) // No hace falta comprobarlo ya que el middleware ya lo ha hecho
        
    resp.send({saludo: "hola " + payload.login, dato: "recurso  protegido 1"})
})

app.get('/miapi/protegido2', chequeaJWT, function(pet, resp){
    resp.send({dato: "recurso protegido 2"})
})

var listener = app.listen(process.env.PORT||3000, () => {
    console.log(`Servidor en el puerto ${listener.address().port}`);
});



