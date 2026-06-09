interface DiscountResult {
  serviceDiscount: number
  productDiscount: number
  totalServices: number
  totalProducts: number
}

interface Item {
  type: 'SERVICE' | 'PRODUCT'
  price: number
}

export const calculateDiscounts = (items: Item[]): DiscountResult => {
  const services = items.filter((i) => i.type === 'SERVICE')
  const products = items.filter((i) => i.type === 'PRODUCT')

  const totalServices = services.reduce((sum, i) => sum + i.price, 0)
  const totalProducts = products.reduce((sum, i) => sum + i.price, 0)

  // Reglas servicios
  let serviceDiscount = 0
  if (services.length >= 2) {
    serviceDiscount = 3
    if (totalServices > 1500) {
      serviceDiscount = 5
    }
  }

  // Reglas productos
  let productDiscount = 0
  if (products.length >= 3) {
    productDiscount = 3
  }
  if (products.length >= 5) {
    productDiscount = 5
  }

  return {
    serviceDiscount,
    productDiscount,
    totalServices,
    totalProducts,
  }
}