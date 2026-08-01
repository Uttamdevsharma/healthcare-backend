import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PatientController } from "./patient.controller";
import { updateMyPatientProfileMiddleware } from "./patient.middlewares";
import { PatientValidation } from "./patient.validation";

const router = Router();

// Patient self-management
router.patch("/update-my-profile",
    checkAuth(Role.PATIENT),
    multerUpload.fields([
        { name: "profilePhoto", maxCount: 1 },
        { name: "medicalReports", maxCount: 5 }
    ]),
    updateMyPatientProfileMiddleware,
    validateRequest(PatientValidation.updatePatientProfileZodSchema),
    PatientController.updateMyProfile
)

// Admin management of patients
router.get("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PatientController.getAllPatients);
router.get("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PatientController.getPatientById);
router.patch("/:id/status", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PatientController.updatePatientStatus);
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PatientController.deletePatient);

export const PatientRoutes = router;