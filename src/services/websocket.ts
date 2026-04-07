import { WS_CONFIG } from '@/config/websocket'
import type {
  ClientMessage,
  ServerMessage,
  DataMessage,
  ErrorMessage,
  DescribeResponseMessage,
  DescribeMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  QueryMessage,
} from './protocol'

type MessageHandler = (message: ServerMessage) => void
type EventCallback = (data?: any) => void

interface RegistrationCleanup {
  (): void
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string = WS_CONFIG.URL
  private reconnectAttempts: number = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private messageHandlers: MessageHandler[] = []
  private eventCallbacks: Map<string, EventCallback[]> = new Map()

  constructor() {
    this.initEventCallbacks()
  }

  private initEventCallbacks(): void {
    this.eventCallbacks.set('onOpen', [])
    this.eventCallbacks.set('onClose', [])
    this.eventCallbacks.set('onError', [])
    this.eventCallbacks.set('onMessage', [])
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    if (this.ws) return Promise.resolve()

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.emit('onOpen')
          resolve()
        }

        this.ws.onmessage = (event) => {
          console.log('WebSocket message received:', event.data)
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('onError', error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket closed')
          this.emit('onClose')
          this.ws = null
          this.attemptReconnect()
        }
      } catch (error) {
        console.error('WebSocket connection error:', error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Send raw message to server
   */
  private send(message: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected')
      return false
    }

    try {
      const data = JSON.stringify(message)
      this.ws.send(data)
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }

  /**
   * Subscribe to data updates
   * @param fields – Field alias → registry key mapping
   * @param frequency – Update frequency in milliseconds (default: 500, min: 50)
   * @param sendOnChange – Only send if values changed (default: false)
   */
  subscribe(
    fields: Record<string, string>,
    frequency: number = 500,
    sendOnChange: boolean = true
  ): boolean {
    const message: SubscribeMessage = {
      type: 'subscribe',
      settings: {
        frequency: Math.max(50, frequency),
        sendOnChange,
      },
      fields,
    }
    return this.send(message)
  }

  /**
   * Unsubscribe from data updates
   */
  unsubscribe(): boolean {
    const message: UnsubscribeMessage = {
      type: 'unsubscribe',
    }
    return this.send(message)
  }

  /**
   * Query data one-shot (doesn't affect subscription)
   */
  query(fields: Record<string, string>): boolean {
    const message: QueryMessage = {
      type: 'query',
      fields,
    }
    return this.send(message)
  }

  /**
   * Request description of available fields
   */
  describe(): boolean {
    const message: DescribeMessage = {
      type: 'describe',
    }
    return this.send(message)
  }

  /**
   * Handle incoming message from server
   */
  private handleMessage(rawData: string): void {
    try {
      const message = JSON.parse(rawData) as ServerMessage

      if (!message.type) {
        console.warn('Received message without type field:', message)
        return
      }

      // Process message based on type
      switch (message.type) {
        case 'data':
          this.handleDataMessage(message as DataMessage)
          break

        case 'error':
          this.handleErrorMessage(message as ErrorMessage)
          break

        case 'describe':
          this.handleDescribeMessage(message as DescribeResponseMessage)
          break

        default:
          console.warn('Unknown message type:', (message as any).type)
      }

      // Notify all registered handlers
      this.messageHandlers.forEach(handler => handler(message))
      this.emit('onMessage', message)
    } catch (error) {
      console.error('Failed to parse message:', error)
    }
  }

  /**
   * Handle data message from server
   */
  private handleDataMessage(message: DataMessage): void {
    console.log(`Data received at ${new Date(message.ts).toISOString()}:`, message.fields)
  }

  /**
   * Handle error message from server
   */
  private handleErrorMessage(message: ErrorMessage): void {
    console.error('Server error:', message.message)
  }

  /**
   * Handle describe message from server
   */
  private handleDescribeMessage(message: DescribeResponseMessage): void {
    console.log('Available fields:', message.fields)
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): RegistrationCleanup {
    this.messageHandlers.push(handler)

    // Return cleanup function
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
    }
  }

  /**
   * Register event listener
   */
  on(event: string, callback: EventCallback): RegistrationCleanup {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }

    const callbacks = this.eventCallbacks.get(event)!
    callbacks.push(callback)

    // Return cleanup function
    return () => {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(
      `Attempting to reconnect... (${this.reconnectAttempts}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`
    )

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, WS_CONFIG.RECONNECT_INTERVAL)
  }
}

// Singleton instance
let instance: WebSocketClient | null = null

export function getWebSocketClient(): WebSocketClient {
  if (!instance) {
    instance = new WebSocketClient()
  }
  return instance
}

export { WebSocketClient }
export type { MessageHandler, EventCallback, RegistrationCleanup }
