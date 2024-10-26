class ApiError extends Error{
    constructor(
        statusCode,
        message = 'Internal Server Error', // default message, generally not used
        errors = [], // list of errors
        stack = '' // stack trace
    ){
        super(message) // calling the parent class constructor, overriding the message
        this.statusCode = statusCode
        this.data = null // additional data to be sent to the client
        this.message = message
        this.errors = errors
        this.stack = stack
        this.success = false
        
        if ( stack ){
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}