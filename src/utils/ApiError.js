class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        error = [], //When the ApiError class is instantiated 
                    //(i.e., when an error occurs in the application and this error is thrown),
                   // it automatically creates a stack trace via Error.captureStackTrace().
                   // This built-in JavaScript function captures the current execution stack 
                   //and assigns it to the stack property of the error object.
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.error = error

        if(stack){
            this.stack = stack

        }else{
            Error.captureStackTrace(this , this.
                constructor)
        }
    }
}

export {ApiError}