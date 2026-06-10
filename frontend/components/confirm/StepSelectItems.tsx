'use client'

import { useState, useEffect } from 'react'
import { useConfirmStore } from '@/store/confirmStore'
import { CatalogItem } from '@/types'
import { formatCurrency } from '@/lib/utils'
import DiscountBadge from './DiscountBadge'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

interface Props {
  onSubmit: () => void
  isLoading: boolean
}

export default function StepSelectItems({ onSubmit, isLoading }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [fetching, setFetching] = useState(true)

  const {
    selectedItems,
    toggleItem,
    isSelected,
    goToStep,
    serviceDiscount,
    productDiscount,
    totalServices,
    totalProducts,
  } = useConfirmStore()

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await api.get('/catalog')
        setItems(data.data)
      } finally {
        setFetching(false)
      }
    }
    fetchItems()
  }, [])

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const services = filtered.filter((i) => i.type === 'SERVICE')
  const products = filtered.filter((i) => i.type === 'PRODUCT')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Servicios y Productos</h2>
        <p className="text-sm text-gray-500 mt-1">Selecciona los de tu interés</p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar Servicios y Productos"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-4 pr-10 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <svg className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {fetching ? (
        <div className="text-center py-8 text-gray-400">Cargando catálogo...</div>
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
          {/* Servicios */}
          {services.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Servicios
              </div>
              {services.map((item) => (
                <ItemRow key={item.id} item={item} selected={isSelected(item.id)} onToggle={toggleItem} />
              ))}
            </>
          )}
          {/* Productos */}
          {products.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Productos
              </div>
              {products.map((item) => (
                <ItemRow key={item.id} item={item} selected={isSelected(item.id)} onToggle={toggleItem} />
              ))}
            </>
          )}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No se encontraron resultados para "{search}"
            </div>
          )}
        </div>
      )}

      {/* Descuentos */}
      {(serviceDiscount > 0 || productDiscount > 0) && (
        <div className="flex gap-3">
          <DiscountBadge label="Descuento en Servicios" discount={serviceDiscount} className="flex-1" />
          <DiscountBadge label="Descuento en Productos" discount={productDiscount} className="flex-1" />
        </div>
      )}

      {/* Resumen selección */}
      {selectedItems.length > 0 && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm">
          <p className="font-medium text-indigo-900">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} seleccionado{selectedItems.length > 1 ? 's' : ''}
          </p>
          {totalServices > 0 && (
            <p className="text-indigo-700">Servicios: {formatCurrency(totalServices)}</p>
          )}
          {totalProducts > 0 && (
            <p className="text-indigo-700">Productos: {formatCurrency(totalProducts)}</p>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={() => goToStep(1)} className="flex-1">
          ← Atrás
        </Button>
        <Button
          onClick={onSubmit}
          disabled={selectedItems.length === 0}
          isLoading={isLoading}
          className="flex-1"
        >
          Confirmar asistencia →
        </Button>
      </div>
    </div>
  )
}

function ItemRow({
  item,
  selected,
  onToggle,
}: {
  item: CatalogItem
  selected: boolean
  onToggle: (item: CatalogItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
    >
      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
        selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
      }`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="flex-1 text-sm text-gray-800">{item.name}</span>
      <span className="text-sm font-medium text-gray-600">{formatCurrency(Number(item.price))}</span>
    </button>
  )
}