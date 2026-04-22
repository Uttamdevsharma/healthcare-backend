
import {Router} from 'express'
import { AuthRoutes } from '../modules/auth/auth.routes'
import { SpecialtyRoutes } from '../modules/speciality/speciality.routes'

const router = Router()


router.use("/auth",AuthRoutes)
router.use("/specialties",SpecialtyRoutes)

export const IndexRoutes = router