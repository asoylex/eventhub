import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../../config/database'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt'
import { AppError } from '../../middlewares/errorHandler'
import { RegisterInput, LoginInput } from './auth.schema'
import { env } from '../../config/env'

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existing) {
    throw new AppError('Email already registered', 409)
  }

  const hashedPassword = await bcrypt.hash(input.password, 12)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  })

  return user
}

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401)
  }

  const validPassword = await bcrypt.compare(input.password, user.password)
  if (!validPassword) {
    throw new AppError('Invalid credentials', 401)
  }

  const payload = { userId: user.id, email: user.email, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  // Guardar refresh token en DB
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  }
}

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token)

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  // Rotar el refresh token
  await prisma.refreshToken.delete({ where: { token } })

  const newPayload = {
    userId: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  }

  const newAccessToken = signAccessToken(newPayload)
  const newRefreshToken = signRefreshToken(newPayload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      token: newRefreshToken,
      userId: stored.user.id,
      expiresAt,
    },
  })

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

export const logoutUser = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } })
}