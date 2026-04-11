import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";


const register = catchAsync(
    async(req:Request,res:Response) => {
    const payload = req.body

    const result =  await authService.register(payload)

    sendResponse(res, {
        httpStatusCode : status.CREATED,
        success : true,
        message : "Patient registered successfully",
        data : result
    })
}
)

const patientLogin = catchAsync( 
    async(req:Request,res : Response) => {
        const payload = req.body

        const result = await authService.patientLogin(payload)

        sendResponse(res, {
            httpStatusCode : status.OK,
            success : true,
            message : "Patiend login successfully",
            data : result
        })
    }
)

export const authController = {
    register,
    patientLogin
}