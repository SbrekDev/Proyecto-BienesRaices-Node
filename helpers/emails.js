import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const {email, nombre, token} = datos

    // eviar email
    await transport.sendMail({
        from: 'Bienes Raices',
        to: email,
        subject: `Hola ${nombre}, confirma tu cuenta`,
        text: `Hola ${nombre}, confirma tu cuenta`,
        html: `<p>Hola ${nombre}, has creado tu cuenta en bienes raices exitosamente, por favor presiona en el siguiente enlace para completar tu confirmación:
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Haz click aquí</a></p>

        `
    })

}

const emailOlvidePassword = async (datos) => {

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const {email, nombre, token} = datos

    // eviar email
    await transport.sendMail({
        from: 'Bienes Raices',
        to: email,
        subject: `Hola ${nombre}, parece que has perdido tu contraseña`,
        text: `Hola ${nombre}, parece que has perdido tu contraseña`,
        html: `<p>Hola ${nombre}, has perdido tu contraseña en bienes raices, por favor presiona en el siguiente enlace para reestablecerla:
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}">Haz click aquí</a></p>

        `
    })

}

export {
    emailRegistro,
    emailOlvidePassword
}