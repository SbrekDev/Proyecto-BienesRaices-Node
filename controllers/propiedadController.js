import {unlink} from 'node:fs/promises'
import {Precio, Categoria, Propiedad, Mensaje, Usuario} from "../models/index.js"
import { validationResult } from "express-validator"
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req,res) => {

    const {pagina: paginaActual} = req.query

    const expresion = /^[0-9]$/

    if(!expresion.test(paginaActual)){
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const {id} = req.usuario

        // limites y offset
        const limit = 10;
        const offset = ((paginaActual * limit) - limit) 

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioId: id
                },
                include: [
                    {model: Categoria, as: 'categoria'},
                    {model: Precio, as: 'precio'},
                    {model: Mensaje, as: 'mensajes'}
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioId: id
                }
            })
        ])

        
    
        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total/limit),
            paginaActual,
            total,
            offset,
            limit
        })
        
    } catch (error) {
        console.log(error);
        
    }
}

const crear = async (req,res) => {

    // consultar a db
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ]);



    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}
const guardar = async (req,res) => {

    // validacion 
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ]);

        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    
    // crear un registro 

    const {titulo, descripcion, categoria, precio, habitaciones, estacionamiento, wc, calle, lat, lng} = req.body
    const { id: usuarioId } = req.usuario

    try {


        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento, 
            wc,
            calle,
            lat,
            lng,
            categoriaId: categoria,
            precioId: precio,
            usuarioId,
            imagen: ''
        })

        const {id} = propiedadGuardada

        res.redirect(`/propiedades/agregar-imagen/${id}`)
        
    } catch (error) {
        console.log(error);
    }

}

const agregarImagen = async (req,res) => {

    const {id} = req.params
    // validaciones
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }

    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }


    res.render('propiedades/agregar-imagen', {
        pagina: 'Subir Imagen',
        propiedad,
        csrfToken: req.csrfToken(),

    })
}

const almacenarImagen = async (req,res, next) => {

    const {id} = req.params
    // validaciones
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }

    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }


    try {

        
        
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1

        await propiedad.save()

        next()
    } catch (error) {
        console.log(error);
    }

}

const editar = async (req,res)=>{

    const {id} = req.params;

    // validar
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    // consultar a db
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ]);



    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })
}

const guardarCambios = async (req, res)=>{

    // validacion 
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ]);

        return res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }
    
    const {id} = req.params;

    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    // reescribir y actualizar
    try {
        const {titulo, descripcion, categoria, precio, habitaciones, estacionamiento, wc, calle, lat, lng} = req.body

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento, 
            wc,
            calle,
            lat,
            lng,
            categoriaId: categoria,
            precioId: precio,
        })
        await propiedad.save()
        res.redirect('/mis-propiedades')
        
    } catch (error) {
        console.log(error);
        
    }
}

const eliminar = async (req,res)=> {
       // validacion 
       
       const {id} = req.params;
   
       const propiedad = await Propiedad.findByPk(id)
       if(!propiedad){
           return res.redirect('/mis-propiedades')
       }
   
       if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
           return res.redirect('/mis-propiedades')
       }     

       // eliminar imagen
       await unlink(`public/uploads/${propiedad.imagen}`)

       // eliminar propiedad
       await propiedad.destroy()
       res.redirect('/mis-propiedades')
}

const cambiarEstado = async (req,res)=>{

    // validacion      
    const {id} = req.params;

    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    } 
    
    // actualizar
    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: true
    })

}

const mostrarPropiedad = async (req,res)=> {

    const {id} = req.params

    // validar 
    const propiedad = await Propiedad.findByPk(id, {
            include: [
                {model: Categoria, as: 'categoria', scope: 'eliminarPassword'},
                {model: Precio, as: 'precio'}
            ]
    })

    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404')
    }


    res.render('propiedades/mostrar',{
       propiedad,
       pagina: propiedad.titulo,
       csrfToken: req.csrfToken(),
       usuario: req.usuario,
       esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)

    })
}

const enviarMensaje = async (req,res)=> {
    const {id} = req.params

    // validar 
    const propiedad = await Propiedad.findByPk(id, {
            include: [
                {model: Categoria, as: 'categoria'},
                {model: Precio, as: 'precio'}
            ]
    })

    if(!propiedad){
        return res.redirect('/404')
    }

    // renderizar errores
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        res.render('propiedades/mostrar',{
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
         })
    }

    const {mensaje} = req.body
    const {id: propiedadId} = req.params
    const {id: usuarioId} = req.usuario

    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })

    res.redirect('/')
  
}

const verMensajes = async (req, res) => {

    // validacion 

    const {id} = req.params;

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {model: Mensaje, as: 'mensajes',
                include: [
                    {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
            }
        ]
    })
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }     

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
}