
import { Router } from "express";
import { DoctorController } from "./doctor.controller";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../middleware/validateRequest";
import { updateDoctorZodSchema } from "./doctor.validation";

const router = Router()

router.get('/', DoctorController.getAllDoctors);
router.get('/top-rated', DoctorController.getTopRatedDoctors);
router.get('/:id', DoctorController.getDoctorById);
router.patch('/:id', multerUpload.single("profilePhoto"), validateRequest(updateDoctorZodSchema), DoctorController.updateDoctor);
router.delete('/:id', DoctorController.deleteDoctor)

export const DoctorRoutes = router