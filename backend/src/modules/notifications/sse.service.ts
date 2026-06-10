import { Response } from 'express'

// Guarda conexiones activas de clientes SSE
const clients = new Map<string, Response>()

export const addClient = (userId: string, res: Response) => {
  // Headers para SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Ping cada 30s para mantener la conexión viva
  const ping = setInterval(() => {
    res.write('event: ping\ndata: {}\n\n')
  }, 30000)

  clients.set(userId, res)

  // Limpia cuando el cliente se desconecta
  res.on('close', () => {
    clearInterval(ping)
    clients.delete(userId)
  })
}

export const broadcastToSales = (data: object) => {
  const message = `event: notification\ndata: ${JSON.stringify(data)}\n\n`
  clients.forEach((res) => {
    res.write(message)
  })
}