import { DataTypes } from "sequelize";
import db from "../config/db.js";


const Mensaje = db.define('mensajes', {

    mensaje: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    
})

export default Mensaje