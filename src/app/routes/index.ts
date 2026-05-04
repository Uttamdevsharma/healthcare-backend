
import {Router} from 'express'
import { AuthRoutes } from '../modules/auth/auth.routes'
import { SpecialtyRoutes } from '../modules/speciality/speciality.routes'
import { UserRouter } from '../modules/user/user.route'
import { DoctorRoutes } from '../modules/doctor/doctor.route'

const router = Router()


router.use("/auth",AuthRoutes)
router.use("/specialties",SpecialtyRoutes)
router.use("/users",UserRouter)
router.use('/doctors',DoctorRoutes)


export const IndexRoutes = router