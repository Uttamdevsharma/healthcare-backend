import { SpecialtyValidation } from './speciality.validation';
import { multerUpload } from './../../config/multer.config';
import { checkAuth } from './../../middleware/checkAuth';
import { Router } from "express";
import { SpecialtyController } from "./speciality.controller";
import { Role } from '../../../generated/prisma/enums';
import { validateRequest } from '../../middleware/validateRequest';
const router = Router();

// checkAuth(Role.SUPER_ADMIN,Role.ADMIN),
router.post("/", multerUpload.single("file"),validateRequest(SpecialtyValidation.createSpecialtyZodSchema),SpecialtyController.createSpecialty);
router.get("/", SpecialtyController.getAllSpecialties)
router.delete("/:id",checkAuth(Role.ADMIN,Role.SUPER_ADMIN),SpecialtyController.deleteSpecialty)

export const SpecialtyRoutes = router