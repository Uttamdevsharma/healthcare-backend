import { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { tokenUtils } from "../../utils/token";


const register = catchAsync(
    async(req:Request,res:Response) => {
    const payload = req.body

    const result =  await authService.register(payload)

    const {accessToken,refreshToken,token, ...rest} = result

    tokenUtils.setAccessTokenCookie(res,accessToken)
    tokenUtils.setRefreshTokenCookie(res, refreshToken)
    tokenUtils.setBetterAuthSessionCookie(res, token as string)


    sendResponse(res, {
        httpStatusCode : status.CREATED,
        success : true,
        message : "Patient registered successfully",
        data : {
            token,
            accessToken,
            refreshToken,
            ...rest
        }
    })
}
)

const patientLogin = catchAsync( 
    async(req:Request,res : Response) => {
        const payload = req.body

        const result = await authService.patientLogin(payload)

        const {accessToken,refreshToken,token, ...rest} = result

        tokenUtils.setAccessTokenCookie(res,accessToken)
        tokenUtils.setRefreshTokenCookie(res, refreshToken)
        tokenUtils.setBetterAuthSessionCookie(res, token)

        sendResponse(res, {
            httpStatusCode : status.OK,
            success : true,
            message : "Patiend login successfully",
            data : {
                token,
                accessToken,
                refreshToken,
                ...rest
            }
        })
    }
)

export const authController = {
    register,
    patientLogin
}