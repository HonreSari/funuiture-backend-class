import { errorCode } from '../../config/errorCode'
export const checkUserExited = (user: any) => {
    if(user) {
        const error: any = new Error("This phone has already has been registered");
        error.status = 409;
        error.code = errorCode.userExist;
        throw error;
    }
}

export const  checkOtpErrorIfSameDate =  (isSameData : boolean , errorCount : number) => {
    if( isSameData && errorCount === 5){
        const error : any = new Error (
            "OTP is wrong for 5 times , plaease try again in tomorrow"
        );
        error.status = 401;
        error.code = errorCode.overLimit;
        throw error;

    }
}

export const checkOtpRow = (otpRow: any) => {
    if(!otpRow){
        const error : any = new Error("Phone number is wrong");
        error.status = 400;
        error.code = errorCode.invalid;
        throw error;
    }
}

export const checkUserIfNotExit = (user: any ) => {
   if( !user){
       const error : any = new Error("This phone has not registered");
        error.status = 401;
        error.code = errorCode.unauthenticated;
        throw error;
   }   
}