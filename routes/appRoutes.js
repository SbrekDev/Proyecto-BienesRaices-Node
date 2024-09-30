import express from 'express'
import { inicio, categoria,noEncontrado,buscador } from '../controllers/appController.js';

const router = express.Router()

router.get('/', inicio)

router.get('/categorias/:id', categoria)

router.get('/404', noEncontrado)

router.post('/buscador', buscador)


export default router;