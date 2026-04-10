import express, { Application, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { IndexRoutes } from './app/routes';

const app :Application = express()


//Enable url-encoded form data parsin 
app.use(express.urlencoded({extended:true}))


//middleware
app.use(express.json());
app.use(cookieParser());



app.use("/api/v1", IndexRoutes)



app.get("/" , async(req:Request,res:Response) => {
    res.status(201).json({
        success : true,
        message : 'Healthcare API is working'
    })
})


export default app


