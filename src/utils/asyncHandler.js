// const asyncHandler = () => {}
// const asyncHandler = (fn) => {}
// const asyncHandler = () => { return () => {} }
// const asyncHandler = () => { return (req, res, next) => {} }
// const asyncHandler = (fn) => { async () => {} }

/*
const asyncHandler = (fn) => async(req,res,next) => {
    // async (req,res,next) => {} is the function that will be passed to the route
    // fn is the function that will be passed to the async function
    // extracting the req,res,next from the function passed to the route
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(errror.code || 500).json({
            success: false,
            message: error.message})
    }
}
*/

const asyncHandler = (fn) => (req,res,next) => {
    return ((req,res,next) => {
        Promise.resolve(fn(req,res,next)).catch( (error) => {next(error)})
    }
    )(req,res,next)
}
// asyncHandler is a middleware function that takes a function as an argument and returns a function. The returned function is an async function that takes three arguments: req, res, and next.

export {asyncHandler}