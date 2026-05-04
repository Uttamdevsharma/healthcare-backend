import { NextFunction, Request, Response } from "express"
import { envVars } from "../config/env"
import status from "http-status"
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface"
import z from 'zod'
import { handleZodError } from "../errorHelpers/haneleZodError"



export const globalErrorHandler = (err:any,req:Request,res:Response,next:NextFunction) => {
    if(envVars.NODE_ENV === 'development'){
        console.log("Error from Global Error Handler",err)
    }


    let errorSources : TErrorSources[] = []
    let statusCode : number = status.INTERNAL_SERVER_ERROR
    let message : string = 'Internal Server Error';
    let stack: string | undefined = undefined


    if(err instanceof z.ZodError){
        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError.statusCode as number
        message = simplifiedError.message,
        errorSources = [...simplifiedError.errorSources]
        stack = err.stack
    }

    const errorResponse: TErrorResponse = {
        success : false,
        message : message,
        errorSources,
        error : envVars.NODE_ENV === 'development' ? err : undefined,
        stack : envVars.NODE_ENV === 'development' ? stack : undefined
    }






   

}