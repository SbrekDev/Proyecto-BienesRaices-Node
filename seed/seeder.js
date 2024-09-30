import categorias from "./categorias.js";
import {Precio, Categoria} from '../models/index.js'
import db from "../config/db.js";
import precios from "./precios.js";

const importarDatos = async () => {
    try {
        
        // autenticar
        await db.authenticate()

        // generar las columnas
        await db.sync()

        // insertar los datos

        await Promise.all([Categoria.bulkCreate(categorias), Precio.bulkCreate(precios)])

        console.log('datos importados correctamente');

        process.exit()
        

    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

const eliminarDatos = async ()=> {
    try {

        await db.sync({force: true})
        
        console.log('datos eliminados correctamente');

        process.exit()
        

    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

if(process.argv[2] === "-i"){
    importarDatos();
}
if(process.argv[2] === "-e"){
    eliminarDatos();
}

