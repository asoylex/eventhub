import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { sendSuccess } from '../../utils/apiResponse'

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await authService.registerUser(req.body)
        sendSuccess(res, user, 'User registered successfully', 201)
    } catch (err) {
        next(err)
    }
}

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await authService.loginUser(req.body)
        sendSuccess(res, result, 'Login successful')
    } catch (err) {
        next(err)
    }
}

export const refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { refreshToken } = req.body
        const tokens = await authService.refreshTokens(refreshToken)
        sendSuccess(res, tokens, 'Tokens refreshed')
    } catch (err) {
        next(err)
    }
}

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { refreshToken } = req.body
        await authService.logoutUser(refreshToken)
        sendSuccess(res, null, 'Logged out successfully')
    } catch (err) {
        next(err)
    }
}