import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { UserStatus } from "../../../generated/prisma/enums";


interface IRegisterPayload {
    name:string;
    email:string;
    password:string
}

interface ILoginPayload {
    email : string,
    password : string
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


const patientLogin = async(payload : ILoginPayload) => {

    const {email,password} = payload

    const data = await auth.api.signInEmail ({
        body : {
            email,
            password
        }
    })


    if (data.user.status === UserStatus.BLOCKED) {
        throw new Error("User is blocked");
    }

    if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
        throw new Error("User is deleted");
    }


    return data

}



export const authService = {
    register,
    patientLogin
}