import express from 'express'
import { about, home } from '../../controllers/web/controller'


const router = express.Router()

router.get('/home', home)
router.get('/about', about)
export default router