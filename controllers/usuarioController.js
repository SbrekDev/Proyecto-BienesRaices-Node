import Usuario from '../models/Usuario.js'
import { check, validationResult } from 'express-validator'
import { generarID, generarJWT } from '../helpers/tokens.js'
import { emailOlvidePassword, emailRegistro } from '../helpers/emails.js'
import bcrypt from 'bcrypt'



const formularioLogin = (req,res)=> {
    res.render('auth/login',{
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken(),
    })
}
const autenticar = async (req,res) => {
    await check('email').isEmail().withMessage('Email invalido').run(req)
    await check('password').notEmpty().withMessage('La contraseña es obligatoria').run(req)

    let resultado = validationResult(req) 

    // verificar que no haya errores
    if(!resultado.isEmpty()){

        return res.render('auth/login',{
            pagina: 'Iniciar sesión',
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
        })

    }

    // comprobar si el user existe

    const {email, password} = req.body

    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario){
        return res.render('auth/login',{
            pagina: 'Iniciar sesión',
            errores: [{msg: 'El usuario es incorrecto'}],
            csrfToken: req.csrfToken(),
        })
    }

    // comprobar user confirmado

    if(!usuario.confirmado) {
        return res.render('auth/login',{
            pagina: 'Iniciar sesión',
            errores: [{msg: 'El usuario no está confirmado'}],
            csrfToken: req.csrfToken()
        })
    }

    // comprobar password

    if(!usuario.verificarPassword(password)){
        return res.render('auth/login',{
            pagina: 'Iniciar sesión',
            errores: [{msg: 'Contraseña incorrecta'}],
            csrfToken: req.csrfToken()
        })
    }

    // autenticar al usuario

    const token = generarJWT(usuario.id)

    // almacenar en un cookie
    return res.cookie('_token', token, {
        httpOnly: true
    }).redirect('/mis-propiedades')

}
const cerrarSesion = (req,res)=>{
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}
const formularioRegistro = (req,res)=> {
    res.render('auth/registro',{
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
    })
}
const registrar = async (req,res)=> {

    // validacion
    await check('nombre').notEmpty().withMessage('El nombre no puede estar vacío').run(req)
    await check('email').isEmail().withMessage('Email invalido').run(req)
    await check('password').isLength({min: 6}).withMessage('La contraseña debe contener al menos 6 caracteres').run(req)
    await check('repetir-password').equals(req.body.password).withMessage('Las contraseñas deben coincidir').run(req)

    let resultado = validationResult(req)

    

    // verificar que no haya errores
    if(!resultado.isEmpty()){

        return res.render('auth/registro',{
            pagina: 'Crear Cuenta',
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            }
        })

    }

    const {nombre, email, password} = req.body

    const existeUsuario = await Usuario.findOne({where: {email}})

    if(existeUsuario){
        return res.render('auth/registro',{
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Usuario ya esta registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            }
        })
    }

    const usuario = await Usuario.create({
        nombre,
        email, 
        password,
        token: generarID()
    })  

    // enviar email confirmacion

    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    res.render('templates/mensaje', {
        pagina: 'Cuenta creada Correctamente',
        mensaje: 'Hemos enviado un mensaje de confirmacion, presiona el siguiente enlace'
    })

}
const formularioOlvidePassword = (req,res)=> {
    res.render('auth/olvide-password',{
        pagina: 'Recuperar Cuenta',
        csrfToken: req.csrfToken()
    })
}
const confirmar = async (req,res, next) => {

    const {token} = req.params;

    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario){
        return res.render(`auth/confirmar`,{
            pagina: 'Error al confirmar cuenta',
            mensaje: 'El token es invalido, intenta otra vez',
            error: true
        })
    }

    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save()

    return res.render(`auth/confirmar`,{
        pagina: 'Cuenta confirmada',
        mensaje: 'Cuenta confirmada exitosamente',
    })
}
const resetPassword = async (req,res) => {
    
    // validacion

    await check('email').isEmail().withMessage('Email invalido').run(req)


    let resultado = validationResult(req)

    

    // verificar que no haya errores
    if(!resultado.isEmpty()){

        return res.render('auth/olvide-password',{
            pagina: 'Recuperar Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })

    }

    // buscar el usuario
    const {email} = req.body;

    const usuario = await Usuario.findOne({where: {email}})

    if(!usuario){
        return res.render('auth/olvide-password',{
            pagina: 'Recuperar Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El email no pertenece a ningun usuario'}]
        })
    }

    usuario.token = generarID();
    await usuario.save();

    emailOlvidePassword({
        email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    res.render('templates/mensaje', {
        pagina: 'Reestablecer',
        mensaje: 'Hemos enviado un mensaje a tu correo, presiona el siguiente enlace'
    })

}
const comprobarToken = async (req,res) => {
    const {token} = req.params;

    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario){
        return res.render(`auth/confirmar`,{
            pagina: 'Error al recuperar cuenta',
            mensaje: 'El token es invalido, intenta otra vez',
            error: true
        })
    }

    res.render('auth/reset-password', {
        pagina: 'Reestablecer password',
        csrfToken: req.csrfToken()
    })
}
const nuevoPassword = async (req,res) => {

    await check('password').isLength({min: 6}).withMessage('La contraseña debe contener al menos 6 caracteres').run(req)
    await check('repetir-password').equals(req.body.password).withMessage('Las contraseñas deben coincidir').run(req)

    let resultado = validationResult(req)

       // verificar que no haya errores
    if(!resultado.isEmpty()){

        return res.render('auth/reset-password',{
            pagina: 'Reestablecer Cuenta',
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
        })

    }

    const {token} = req.params;
    const {password} = req.body;

    const usuario = await Usuario.findOne({where: {token}})

    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash( password, salt)
    usuario.token = null;

    await usuario.save()

    res.render('auth/confirmar', {
        pagina: 'Password reestablecido',
        mensaje: 'El nuevo password se guardó correctamente'
    })

    
}

export {
    formularioLogin,
    formularioRegistro,
    formularioOlvidePassword,
    registrar,
    confirmar,
    resetPassword,
    comprobarToken,
    nuevoPassword,
    autenticar,
    cerrarSesion
}