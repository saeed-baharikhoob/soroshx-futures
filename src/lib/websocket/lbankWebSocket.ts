import { OrderbookEntry } from '@/types/trading'
import type { LBankWebSocketMessage } from '@/types/websocket'

export type WebSocketMessageHandler = (data: LBankWebSocketMessage) => void

export class LBankWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private messageHandlers: Map<string, WebSocketMessageHandler[]> = new Map()
  private subscribedChannels: Set<string> = new Set()
  private isConnecting = false

  constructor(private url: string = 'wss://www.lbkex.net/ws/V2/') {}

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve()
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('LBank WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0

          this.subscribedChannels.forEach((channel) => {
            this.sendSubscription(channel)
          })

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as LBankWebSocketMessage
            this.handleMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('LBank WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('LBank WebSocket disconnected')
          this.isConnecting = false
          this.ws = null
          this.attemptReconnect()
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      setTimeout(() => {
        this.connect().catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  private sendSubscription(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const [type, pair] = channel.split('.')

      let subscription: any = {
        action: 'subscribe',
        subscribe: type,
        pair: pair,
      }

      if (type === 'depth') {
        subscription.depth = '60'
      }

      this.ws.send(JSON.stringify(subscription))
      console.log('Subscribed to:', channel, 'with message:', subscription)
    }
  }

  subscribe(channel: string, handler: WebSocketMessageHandler): void {
    const handlers = this.messageHandlers.get(channel) || []
    handlers.push(handler)
    this.messageHandlers.set(channel, handlers)

    this.subscribedChannels.add(channel)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(channel)
    } else {
      this.connect().then(() => {
        this.sendSubscription(channel)
      }).catch(console.error)
    }
  }

  unsubscribe(channel: string, handler?: WebSocketMessageHandler): void {
    if (handler) {
      const handlers = this.messageHandlers.get(channel) || []
      const filteredHandlers = handlers.filter((h) => h !== handler)

      if (filteredHandlers.length > 0) {
        this.messageHandlers.set(channel, filteredHandlers)
      } else {
        this.messageHandlers.delete(channel)
        this.subscribedChannels.delete(channel)

        if (this.ws?.readyState === WebSocket.OPEN) {
          const [type, pair] = channel.split('.')
          const unsubscription = {
            action: 'unsubscribe',
            unsubscribe: type,
            pair: pair,
          }
          this.ws.send(JSON.stringify(unsubscription))
        }
      }
    } else {
      this.messageHandlers.delete(channel)
      this.subscribedChannels.delete(channel)

      if (this.ws?.readyState === WebSocket.OPEN) {
        const [type, pair] = channel.split('.')
        const unsubscription = {
          action: 'unsubscribe',
          unsubscribe: type,
          pair: pair,
        }
        this.ws.send(JSON.stringify(unsubscription))
      }
    }
  }

  private handleMessage(data: LBankWebSocketMessage): void {
    const channel = data.type && data.pair ? `${data.type}.${data.pair}` : null

    if (channel) {
      console.log('Received message for channel:', channel)
      const handlers = this.messageHandlers.get(channel)
      if (handlers) {
        handlers.forEach((handler) => handler(data))
      } else {
        console.log('No handlers found for channel:', channel)
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.subscribedChannels.clear()
      this.messageHandlers.clear()
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

let lbankWS: LBankWebSocket | null = null

export const getLBankWebSocket = (): LBankWebSocket => {
  if (!lbankWS) {
    lbankWS = new LBankWebSocket()
  }
  return lbankWS
}
