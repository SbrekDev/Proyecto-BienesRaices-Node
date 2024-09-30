import express from 'express';
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';



// crear la app
const app = express()

// habilitar lectura de datos de forms
app.use(express.urlencoded({extended: true}))

// habilitar cookie parser
app.use(cookieParser())
// habilitar csrf
app.use(csrf({cookie: true}))

// conexion a db
try {
     db.authenticate();
     db.sync()
     console.log('Conexion correcta a la db');
     
} catch (error) {
    console.log(error);
    
}

// habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

// carpewta publica
app.use( express.static('public'))

app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)

const port = process.env.PORT || 3000;

app.listen(port,()=> {
    console.log(`sv funcionando en el puerto ${port}`);
    
})
