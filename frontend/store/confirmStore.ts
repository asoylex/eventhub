import { create } from 'zustand'
import { CatalogItem } from '@/types'

interface ConfirmState {
  // Paso 1 — datos personales
  firstName: string
  lastName: string
  email: string
  attendanceDate: string

  // Paso 2 — items seleccionados
  selectedItems: CatalogItem[]

  // Control de pasos
  currentStep: 1 | 2

  // Acciones
  setPersonalInfo: (data: {
    firstName: string
    lastName: string
    email: string
    attendanceDate: string
  }) => void
  toggleItem: (item: CatalogItem) => void
  isSelected: (id: string) => boolean
  goToStep: (step: 1 | 2) => void
  reset: () => void

  // Descuentos calculados en tiempo real
  serviceDiscount: number
  productDiscount: number
  totalServices: number
  totalProducts: number
}

const calcDiscounts = (items: CatalogItem[]) => {
  const services = items.filter((i) => i.type === 'SERVICE')
  const products = items.filter((i) => i.type === 'PRODUCT')

  const totalServices = services.reduce((s, i) => s + Number(i.price), 0)
  const totalProducts = products.reduce((s, i) => s + Number(i.price), 0)

  let serviceDiscount = 0
  if (services.length >= 2) {
    serviceDiscount = totalServices > 1500 ? 5 : 3
  }

  let productDiscount = 0
  if (products.length >= 3) productDiscount = 3
  if (products.length >= 5) productDiscount = 5

  return { serviceDiscount, productDiscount, totalServices, totalProducts }
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  firstName: '',
  lastName: '',
  email: '',
  attendanceDate: '',
  selectedItems: [],
  currentStep: 1,
  serviceDiscount: 0,
  productDiscount: 0,
  totalServices: 0,
  totalProducts: 0,

  setPersonalInfo: (data) => set({ ...data }),

  toggleItem: (item) => {
    const current = get().selectedItems
    const exists = current.find((i) => i.id === item.id)
    const updated = exists
      ? current.filter((i) => i.id !== item.id)
      : [...current, item]

    const discounts = calcDiscounts(updated)
    set({ selectedItems: updated, ...discounts })
  },

  isSelected: (id) => get().selectedItems.some((i) => i.id === id),

  goToStep: (step) => set({ currentStep: step }),

  reset: () =>
    set({
      firstName: '',
      lastName: '',
      email: '',
      attendanceDate: '',
      selectedItems: [],
      currentStep: 1,
      serviceDiscount: 0,
      productDiscount: 0,
      totalServices: 0,
      totalProducts: 0,
    }),
}))