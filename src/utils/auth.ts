export const checkUserExited = (user: any) => {
    if(user) {
        const error: any = new Error("This phone has already has been registered");
        error.status = 409;
        error.code = "Error_AlreadyExist";
        throw error;
    }
}