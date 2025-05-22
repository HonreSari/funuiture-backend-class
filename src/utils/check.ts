import { errorCode  } from "../../config/errorCode";

export  const checkUploadFile = (file : any ) => {
    if(!file){
        const error : any = new Error("File not found");
        error.status = 404;
        error.code = errorCode.invalid;
        throw error;
    }
}