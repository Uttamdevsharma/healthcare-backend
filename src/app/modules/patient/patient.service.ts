import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import {
  IUpdatePatientHealthDataPayload,
  IUpdatePatientProfilePayload,
} from "./patient.interface";
import { convertToDateTime } from "./patient.utils";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";

const updateMyProfile = async (
  user: IRequestUser,
  payload: IUpdatePatientProfilePayload,
) => {
  // throw new Error("This is an intentional error to test Sentry integration in the backend.");
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      userId: user.userId,
    },
    include: {
      patientHealthData: true,
      medicalReports: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    if (payload.patientInfo) {
      await tx.patient.update({
        where: {
          id: patientData.id,
        },
        data: {
          ...payload.patientInfo,
        },
      });

      if (payload.patientInfo.name || payload.patientInfo.profilePhoto) {
        const userData = {
          name: payload.patientInfo.name
            ? payload.patientInfo.name
            : patientData.name,
          image: payload.patientInfo.profilePhoto
            ? payload.patientInfo.profilePhoto
            : patientData.profilePhoto,
        };
        await tx.user.update({
          where: {
            id: patientData.userId,
          },
          data: {
            ...userData,
          },
        });
      }
    }

    if (payload.patientHealthData) {
      const healthDataToSave: IUpdatePatientHealthDataPayload = {
        ...payload.patientHealthData,
      };

      if (payload.patientHealthData.dateOfBirth) {
        healthDataToSave.dateOfBirth = convertToDateTime(
          typeof healthDataToSave.dateOfBirth === "string"
            ? healthDataToSave.dateOfBirth
            : undefined,
        ) as Date;
      }

      // patientData was fetched with `patientHealthData` included above.
      // If health data already exists -> update, otherwise create.
      if (patientData.patientHealthData) {
        await tx.patientHealthData.update({
          where: { patientId: patientData.id },
          data: healthDataToSave,
        });
      } else {
        // `dateOfBirth` is required by the Prisma schema for creation.
        if (!healthDataToSave.dateOfBirth) {
          throw new AppError(
            status.BAD_REQUEST,
            "dateOfBirth is required when creating patient health data",
          );
        }

        await tx.patientHealthData.create({
          data: {
            patientId: patientData.id,
            ...healthDataToSave,
          },
        });
      }
    }

    if (
      payload.medicalReports &&
      Array.isArray(payload.medicalReports) &&
      payload.medicalReports.length > 0
    ) {
      for (const report of payload.medicalReports) {
        if (report.shouldDelete && report.reportId) {
          const deletedReport = await tx.medicalReport.delete({
            where: {
              id: report.reportId,
            },
          });

          if (deletedReport.reportLink) {
            await deleteFileFromCloudinary(deletedReport.reportLink);
          }
        } else if (report.reportName && report.reportLink) {
          await tx.medicalReport.create({
            data: {
              patientId: patientData.id,
              reportName: report.reportName,
              reportLink: report.reportLink,
            },
          });
        }
      }
    }
  });

  const result = await prisma.patient.findUnique({
    where: {
      id: patientData.id,
    },
    include: {
      user: true,
      patientHealthData: true,
      medicalReports: true,
    },
  });

  return result;
};

const getAllPatients = async () => {
  const patients = await prisma.patient.findMany({
    where: { isDeleted: false },
    include: { user: true },
  });
  return patients;
};

const getPatientById = async (id: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: true,
      patientHealthData: true,
      medicalReports: true,
    },
  });

  if (!patient) {
    throw new AppError(status.NOT_FOUND, "Patient not found");
  }

  return patient;
};

const updatePatientStatus = async (id: string, payload: { status: UserStatus }) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) {
    throw new AppError(status.NOT_FOUND, "Patient not found");
  }

  const updated = await prisma.user.update({
    where: { id: patient.userId },
    data: { status: payload.status },
  });

  return updated;
};

const deletePatient = async (id: string) => {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) {
    throw new AppError(status.NOT_FOUND, "Patient not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.patient.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await tx.user.update({
      where: { id: patient.userId },
      data: { isDeleted: true, deletedAt: new Date(), status: UserStatus.DELETED },
    });

    return await tx.patient.findUnique({
      where: { id },
      include: { user: true },
    });
  });

  return result;
};

export const PatientService = {
  updateMyProfile,
  getAllPatients,
  getPatientById,
  updatePatientStatus,
  deletePatient,
};
