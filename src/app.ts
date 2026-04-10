import express, { Application } from 'express'
import cookieParser from 'cookie-parser'

const app :Application = express()


//Enable url-encoded form data parsin 
app.use(express.urlencoded({extended:true}))


//middleware
app.use(express.json());
app.use(cookieParser());



app.use("/api/v1", IndexRoutes)




