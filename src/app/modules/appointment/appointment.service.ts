import status from "http-status";
// import { uuidv7 } from "zod/mini";
import { v7 as uuidv7 } from "uuid";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { AppointmentStatus } from "./../../../generated/prisma/enums";
import { IBookAppointmentPayload } from "./appointment.interface";

// Pay Now Book Appointment
const bookAppointment = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      userId: user.userId,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        scheduleId: doctorSchedule.scheduleId,
        videoCallingId,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    //TODO : Payment Integration will be here

    const transactionId = String(uuidv7());

    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Appointment with Dr. ${doctorData.name}`,
            },
            unit_amount: doctorData.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointmentData.id,
        paymentId: paymentData.id,
      },

      success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${paymentData.id}`,

      // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
      cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
    });

    await tx.payment.update({
      where: {
        id: paymentData.id,
      },
      data: {
        paymentGatewayData: { checkoutSessionId: session.id },
      },
    });

    return {
      appointmentData,
      paymentData,
      paymentUrl: session.url,
    };
  });

  return {
    appointment: result.appointmentData,
    payment: result.paymentData,
    paymentUrl: result.paymentUrl,
  };
};

const getMyAppointments = async (user: IRequestUser) => {
  //user can be patient or doctor, so we need to check both
  const patientData = await prisma.patient.findUnique({
    where: {
      userId: user?.userId,
    },
  });

  const doctorData = user?.email
    ? await prisma.doctor.findUnique({
        where: {
          email: user.email,
        },
      })
    : null;

  let appointments = [];

  if (patientData) {
    appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
        payment: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else if (doctorData) {
    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
        payment: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else {
    throw new Error("User not found");
  }

  return appointments;
};

// 1. Completed Or Cancelled Appointments should not be allowed to update status
// 2. Doctors can only update Appoinment status from schedule to inprogress or inprogress to complted or schedule to cancelled.
// 3. Patients can only cancel the scheduled appointment if it scheduled not completed or cancelled or inprogress.
// 4. Admin and Super admin can update to any status.

const changeAppointmentStatus = async (
  appointmentId: string,
  appointmentStatus: AppointmentStatus,
  user: IRequestUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  // Completed or Cancelled appointments should not be allowed to update status
  if (
    appointmentData.status === AppointmentStatus.COMPLETED ||
    appointmentData.status === AppointmentStatus.CANCELED
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      `Appointment is already ${appointmentData.status.toLowerCase()}. It cannot be updated`,
    );
  }

  if (user?.role === Role.DOCTOR) {
    if (!(user?.email === appointmentData.doctor.email))
      throw new AppError(status.BAD_REQUEST, "This is not your appointment");

    // Doctors can go SCHEDULED -> INPROGRESS -> COMPLETED, or SCHEDULED -> CANCELED
    const allowedDoctorTransitions: Record<string, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.INPROGRESS,
        AppointmentStatus.CANCELED,
      ],
      [AppointmentStatus.INPROGRESS]: [AppointmentStatus.COMPLETED],
    };

    const allowedStatuses = allowedDoctorTransitions[appointmentData.status];

    if (!allowedStatuses || !allowedStatuses.includes(appointmentStatus)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Doctor cannot change appointment status from ${appointmentData.status} to ${appointmentStatus}`,
      );
    }
  }

  if (user?.role === Role.PATIENT) {
    if (!(appointmentData.patient.userId === user.userId))
      throw new AppError(status.BAD_REQUEST, "This is not your appointment");

    // Patients can only cancel a scheduled appointment
    if (appointmentStatus !== AppointmentStatus.CANCELED) {
      throw new AppError(
        status.BAD_REQUEST,
        "Patients can only cancel a scheduled appointment",
      );
    }

    if (appointmentData.status !== AppointmentStatus.SCHEDULED) {
      throw new AppError(
        status.BAD_REQUEST,
        "Patients can only cancel a scheduled appointment",
      );
    }
  }

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: appointmentStatus,
    },
  });

  // Release the doctor schedule slot when the appointment is cancelled
  if (appointmentStatus === AppointmentStatus.CANCELED) {
    await prisma.doctorSchedules.updateMany({
      where: {
        doctorId: appointmentData.doctorId,
        scheduleId: appointmentData.scheduleId,
      },
      data: {
        isBooked: false,
      },
    });
  }

  return updatedAppointment;
};

// refactoring on include of doctor and patient data in appointment details, we can use query builder to get the data in single query instead of multiple queries in case of doctor and patient both
const getMySingleAppointment = async (
  appointmentId: string,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      userId: user?.userId,
    },
  });

  const doctorData = user?.email
    ? await prisma.doctor.findUnique({
        where: {
          email: user.email,
        },
      })
    : null;

  let appointment;

  if (patientData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  }

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  return appointment;
};

const getAppointmentByVideoCallId = async (
  videoCallingId: string,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      userId: user?.userId,
    },
  });

  const doctorData = user?.email
    ? await prisma.doctor.findUnique({
        where: {
          email: user.email,
        },
      })
    : null;

  let appointment;

  if (patientData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        videoCallingId,
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        patient: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        videoCallingId,
        doctorId: doctorData.id,
      },
      include: {
        doctor: true,
        patient: true,
        schedule: true,
      },
    });
  }

  if (!appointment) {
    throw new AppError(
      status.NOT_FOUND,
      "Appointment not found for this video call",
    );
  }

  return appointment;
};

// integrate query builder
const getAllAppointments = async () => {
  const appointments = await prisma.appointment.findMany({
    include: {
      doctor: true,
      patient: true,
      schedule: true,
      payment: true,
      review: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return appointments;
};

const bookAppointmentWithPayLater = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      userId: user.userId,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        scheduleId: doctorSchedule.scheduleId,
        videoCallingId,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = String(uuidv7());

    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    return {
      appointment: appointmentData,
      payment: paymentData,
    };
  });

  return result;
};

const initiatePayment = async (appointmentId: string, user: IRequestUser) => {  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      userId: user.userId,
    },
  });

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      doctor: true,
      payment: true,
    },
  });

  if (!appointmentData) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  if (!appointmentData.payment) {
    throw new AppError(
      status.NOT_FOUND,
      "Payment data not found for this appointment",
    );
  }

  if (appointmentData.payment?.status === PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "Payment already completed for this appointment",
    );
  }

  if (appointmentData.status === AppointmentStatus.CANCELED) {
    throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Appointment with Dr. ${appointmentData.doctor.name}`,
          },
          unit_amount: appointmentData.doctor.appointmentFee * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: appointmentData.id,
      paymentId: appointmentData.payment.id,
    },

    success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,

    // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
  });

  await prisma.payment.update({
    where: {
      id: appointmentData.payment.id,
    },
    data: {
      paymentGatewayData: { checkoutSessionId: session.id },
    },
  });

  return {
    paymentUrl: session.url,
  };
};

const verifyPayment = async (appointmentId: string, user: IRequestUser) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      userId: user.userId,
    },
  });

  if (!patientData) {
    throw new AppError(status.NOT_FOUND, "Patient not found");
  }

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      payment: true,
    },
  });

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  if (appointment.patientId !== patientData.id) {
    throw new AppError(status.FORBIDDEN, "This appointment does not belong to you");
  }

  if (appointment.paymentStatus === PaymentStatus.PAID) {
    return appointment;
  }

  const payment = appointment.payment;

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment data not found for this appointment");
  }

  const gatewayData = payment.paymentGatewayData as {
    checkoutSessionId?: string;
  } | null;

  const checkoutSessionId = gatewayData?.checkoutSessionId;

  if (!checkoutSessionId) {
    throw new AppError(
      status.BAD_REQUEST,
      "No Stripe payment session found for this appointment",
    );
  }

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

  if (session.payment_status !== "paid") {
    throw new AppError(status.BAD_REQUEST, "Payment is not completed yet");
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
    });

    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.PAID,
        paymentGatewayData: session as any,
      },
    });
  });

  return appointment;
};

const cancelUnpaidAppointments = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const unpaidAppointments = await prisma.appointment.findMany({
    where: {
      // status: AppointmentStatus.SCHEDULED,
      createdAt: {
        lte: thirtyMinutesAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  const appointmentToCancel = unpaidAppointments.map(
    (appointment) => appointment.id,
  );

  await prisma.$transaction(async (tx) => {
    await tx.appointment.updateMany({
      where: {
        id: {
          in: appointmentToCancel,
        },
      },
      data: {
        status: AppointmentStatus.CANCELED,
      },
    });

    await tx.payment.deleteMany({
      where: {
        appointmentId: {
          in: appointmentToCancel,
        },
      },
    });

    for (const unpaidAppointment of unpaidAppointments) {
      await tx.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: unpaidAppointment.doctorId,
            scheduleId: unpaidAppointment.scheduleId,
          },
        },
        data: {
          isBooked: false,
        },
      });
    }
  });
};

export const AppointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMySingleAppointment,
  getAllAppointments,
  getAppointmentByVideoCallId,
  bookAppointmentWithPayLater,
  initiatePayment,
  verifyPayment,
  cancelUnpaidAppointments,
};
