import {Router} from 'express'
import { authController } from './auth.controller'
import { Role } from '../../../generated/prisma/enums'
import { checkAuth } from '../../middleware/checkAuth'

const router= Router()

router.post('/register',authController.register)

router.post('/login',authController.patientLogin)
router.get("/me", checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN), authController.getMe)

router.post("/refresh-token", authController.getNewToken)


export const AuthRoutes = router