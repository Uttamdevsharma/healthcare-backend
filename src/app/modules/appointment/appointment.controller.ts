import { Request, Response } from "express";
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AppointmentService } from "./appointment.service";

const bookAppointment = catchAsync( async (req : Request, res : Response) => {
    const payload = req.body;
    const user = req.user;
    const appointment = await AppointmentService.bookAppointment(payload, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.CREATED, 
        message: 'Appointment booked successfully',
        data: appointment
    });
});

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const appointments = await AppointmentService.getMyAppointments(user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointments retrieved successfully',
        data: appointments
    });
});

const changeAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const payload = req.body;
    const user = req.user;

    const updatedAppointment = await AppointmentService.changeAppointmentStatus(appointmentId as string, payload, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointment status updated successfully',
        data: updatedAppointment
    });
});

const getMySingleAppointment = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;

    const appointment = await AppointmentService.getMySingleAppointment(appointmentId as string, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointment retrieved successfully',
        data: appointment
    });
});

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
    const appointments = await AppointmentService.getAllAppointments();
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'All appointments retrieved successfully',
        data: appointments
    });
});

const getPatientHealthRecords = catchAsync(async (req: Request, res: Response) => {
    const patientId = req.params.patientId;
    const user = req.user;

    const patient = await AppointmentService.getPatientHealthRecords(patientId as string, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Patient health records retrieved successfully',
        data: patient
    });
});

const getAppointmentByVideoCallId = catchAsync(async (req: Request, res: Response) => {
    const videoCallingId = req.params.videoCallingId;
    const user = req.user;

    const appointment = await AppointmentService.getAppointmentByVideoCallId(videoCallingId as string, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointment retrieved successfully',
        data: appointment
    });
});

const bookAppointmentWithPayLater = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    const appointment = await AppointmentService.bookAppointmentWithPayLater(payload, user);
    sendResponse(res, {
        success: true,  
        httpStatusCode: status.CREATED,
        message: 'Appointment booked successfully with Pay Later option',
        data: appointment
    });
});

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;
    const paymentInfo = await AppointmentService.initiatePayment(appointmentId as string, user);

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Payment initiated successfully',
        data: paymentInfo
    });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const { appointmentId } = req.body;

    if (!appointmentId) {
        throw new AppError(status.BAD_REQUEST, 'appointmentId is required');
    }

    const appointment = await AppointmentService.verifyPayment(appointmentId, user);

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Payment verified successfully',
        data: appointment
    });
});

export const AppointmentController = {
    bookAppointment,
    getMyAppointments,
    changeAppointmentStatus,
    getMySingleAppointment,
    getAllAppointments,
    getPatientHealthRecords,
    getAppointmentByVideoCallId,
    bookAppointmentWithPayLater,
    initiatePayment,
    verifyPayment,
}