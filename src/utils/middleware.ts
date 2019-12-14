import {validationResult} from "express-validator";
import {Request, Response, NextFunction} from "express";
import passport from "passport"
import {isDupError} from "./errorHelpers";

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        return next()
    }
    const extractedErrors: any[] = []
    errors.array().map(err => extractedErrors.push({[err.param]: err.msg}))
    return res.status(400).json({
        message: 'Data validation failed',
        errors: extractedErrors,
    })
}

export const authorize = function (req: Request, res: Response, next: NextFunction) {
    passport.authenticate(
        'jwt',
        {session: false},
        function (error, user, info) {
            if (error) {
                res.status(401).json({message: error});
            } else if (!user) {
                res.status(401).send({message: 'invalid user', info});
            } else {
                req.user = user
                next()
            }
        }
    )(req, res, next);
}

export const handleErrors = function (error: any, req: Request, res: Response, next: NextFunction) {
    console.error('Global error')
    if (error) {
        console.error(error);
        if (isDupError(error)) {
            res.status(400).send({
                message: "Duplicate record",
            });
            return
        }
        const message = error.message || 'Oops, unknown error, please contact admin'
        res.json({message});
    }
}
