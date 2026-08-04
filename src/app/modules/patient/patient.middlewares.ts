import { NextFunction, Request, Response } from "express";
import { IUpdatePatientInfoPayload, IUpdatePatientProfilePayload } from "./patient.interface";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";

export const updateMyPatientProfileMiddleware = async (req : Request, res : Response, next : NextFunction) => { 
    if (req.body.data) {
        req.body = JSON.parse(req.body.data)
    }
    const payload: IUpdatePatientProfilePayload = req.body;


    const files = req.files as { [fieldName: string]: Express.Multer.File[] | undefined };

    if (files?.profilePhoto?.[0]) {
        if (!payload.patientInfo) {
            payload.patientInfo = {} as IUpdatePatientInfoPayload;
        }
        const fileName = `patient-profile-${Date.now()}.${files.profilePhoto[0].originalname.split(".").pop()}`;
        const uploadedFile = await uploadFileToCloudinary(files.profilePhoto[0].buffer, fileName);
        payload.patientInfo.profilePhoto = uploadedFile.secure_url;
    }

    if (files?.medicalReports && files?.medicalReports.length > 0) {
        const newReports = await Promise.all(
            files.medicalReports.map(async (file) => {
                const fileName = `medical-report-${Date.now()}-${file.originalname}`;
                const uploadedFile = await uploadFileToCloudinary(file.buffer, fileName);
                return {
                    reportName: file.originalname || `Medical Report - ${new Date().getTime()}`,
                    reportLink: uploadedFile.secure_url,
                };
            })
        );

        if (payload.medicalReports && Array.isArray(payload.medicalReports)) {
            payload.medicalReports = [...payload.medicalReports, ...newReports];
        } else {
            payload.medicalReports = newReports;
        }
    }

    req.body = payload;

    next();
};
