import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";


interface IRegisterPayload {
    name:string;
    email:string;
    password:string
}

const register = async(payload : IRegisterPayload) => {

    const {name, email,password} = payload

    const data = await auth.api.signUpEmail ({
        body : {
            name,
            email,
            password
        }
    })

    if(!data.user) {
        throw new AppError(status.BAD_REQUEST,"Failed to register patient")
    }

    return data
}


export const authService = {
    register
}