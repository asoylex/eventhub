export type Role = 'CLIENT' | 'SALES' | 'ADMIN'
export type ItemType = 'SERVICE' | 'PRODUCT'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

export interface CatalogItem {
  id: string
  name: string
  description: string | null
  price: number
  type: ItemType
  isActive: boolean
}

export interface Event {
  id: string
  name: string
  description: string | null
  capacity: number
  confirmedCount: number
  spotsAvailable: number
  isFull: boolean
  eventDate: string
}

export interface RegistrationItem {
  id: string
  name: string
  type: ItemType
  price: number
}

export interface Registration {
  id: string
  attendanceDate: string
  serviceDiscount: number
  productDiscount: number
  totalServices: number
  totalProducts: number
  items: RegistrationItem[]
  event: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}