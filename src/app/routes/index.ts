
import { Router } from 'express'
import { AdminRoutes } from '../modules/admin/admin.route'
import { AppointmentRoutes } from '../modules/appointment/appointment.route'
import { AuthRoutes } from '../modules/auth/auth.routes'
import { DoctorRoutes } from '../modules/doctor/doctor.route'
import { DoctorScheduleRoutes } from '../modules/doctorSchedule/doctorSchedule.route'
import { PatientRoutes } from '../modules/patient/patient.route'
import { PaymentRoutes } from '../modules/payment/payment.route'
import { PrescriptionRoutes } from '../modules/prescription/prescription.route'
import { ReviewRoutes } from '../modules/review/review.route'
import { SpecialtyRoutes } from '../modules/speciality/speciality.routes'
import { StatsRoutes } from '../modules/stats/stats.route'
import { UserRouter } from '../modules/user/user.route'
import { scheduleRoutes } from '../modules/schedule/schedule.route'
import { RagRoutes } from '../modules/rag/rag.route'

const router = Router()


router.use("/auth", AuthRoutes)
router.use("/specialties", SpecialtyRoutes)
router.use("/users", UserRouter)
router.use('/doctors', DoctorRoutes)
router.use('/doctor-schedules', DoctorScheduleRoutes)
router.use('/stats', StatsRoutes)
router.use('/schedules', scheduleRoutes)
router.use('/appointments', AppointmentRoutes)
router.use('/admins', AdminRoutes)
router.use('/patients', PatientRoutes)
router.use('/prescriptions', PrescriptionRoutes)
router.use('/reviews', ReviewRoutes)
router.use('/payments', PaymentRoutes)
router.use("/rag", RagRoutes);


export const IndexRoutes = router
