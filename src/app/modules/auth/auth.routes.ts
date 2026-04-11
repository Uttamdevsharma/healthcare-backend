import {Router} from 'express'
import { authController } from './auth.controller'

const router= Router()

router.post('/register',authController.register)

router.post('/login',authController.patientLogin)



export const AuthRoutes = router