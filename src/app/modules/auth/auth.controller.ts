import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";


const register = async(req:Request,res:Response) => {
    const payload = req.body

    const result =  await authService.register(payload)

    sendResponse(res, {
        httpStatusCode : status.CREATED,
        success : true,
        message : "Patient registered successfully",
        data : result
    })
}

export const authController = {
    register
}