import { multerUpload } from './../../config/multer.config';
import { checkAuth } from './../../middleware/checkAuth';
import { Router } from "express";
import { SpecialtyController } from "./speciality.controller";
import { Role } from '../../../generated/prisma/enums';
const router = Router();


router.post("/", checkAuth(Role.SUPER_ADMIN,Role.ADMIN),multerUpload.single("file"), SpecialtyController.createSpecialty);
router.get("/", SpecialtyController.getAllSpecialties)
router.delete("/:id",checkAuth(Role.ADMIN,Role.SUPER_ADMIN),SpecialtyController.deleteSpecialty)

export const SpecialtyRoutes = router