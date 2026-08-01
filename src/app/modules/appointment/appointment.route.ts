import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { AppointmentController } from "./appointment.controller";

const router = Router();

router.post("/book-appointment", checkAuth(Role.PATIENT), AppointmentController.bookAppointment);
router.get("/my-appointments", checkAuth(Role.PATIENT, Role.DOCTOR), AppointmentController.getMyAppointments);
router.patch("/change-appointment-status/:id", checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),AppointmentController.changeAppointmentStatus);
router.get("/my-single-appointment/:id", checkAuth(Role.PATIENT, Role.DOCTOR), AppointmentController.getMySingleAppointment);
router.get("/all-appointments", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), AppointmentController.getAllAppointments);
router.get("/by-video-call-id/:videoCallingId", checkAuth(Role.PATIENT, Role.DOCTOR), AppointmentController.getAppointmentByVideoCallId);
router.post("/book-appointment-with-pay-later", checkAuth(Role.PATIENT), AppointmentController.bookAppointmentWithPayLater);
router.post("/initiate-payment/:id", checkAuth(Role.PATIENT), AppointmentController.initiatePayment);
router.post("/verify-payment", checkAuth(Role.PATIENT), AppointmentController.verifyPayment);

export const AppointmentRoutes = router;