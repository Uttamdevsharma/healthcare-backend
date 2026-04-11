import express, { Application, NextFunction, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { IndexRoutes } from './app/routes';
import cors from 'cors'
import { success } from 'better-auth';
import { error } from 'node:console';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';

const app :Application = express()


//Enable url-encoded form data parsin 
app.use(express.urlencoded({extended:true}))


//middleware
app.use(express.json());
// app.use(cookieParser());
app.use(cors())



app.use("/api/v1", IndexRoutes)



app.get("/" , async(req:Request,res:Response) => {
    res.status(201).json({
        success : true,
        message : 'Healthcare API is working'
    })
})


app.use(globalErrorHandler)


export default app


