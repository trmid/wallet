/// Adapted from https://github.com/impersonator-eth/impersonator

import type {
  SDKMessageEvent,
  MethodToResponse,
  ErrorResponse,
  RequestId,
  SDKRequestData,
  SuccessResponse
} from './iframeCommunicatorTypes'
import { Methods } from './iframeCommunicatorTypes'

const sdkVersion = '7.6.0'

// i.e. 0-255 -> '00'-'ff'
const dec2hex = (dec: number): string => dec.toString(16).padStart(2, '0')

const generateId = (len: number): string => {
  const arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}

const generateRequestId = (): string => {
  if (typeof window !== 'undefined') {
    return generateId(10)
  }

  return new Date().getTime().toString(36)
}

class MessageFormatter {
  static makeRequest = <M extends Methods = Methods, P = unknown>(
    method: M,
    params: P
  ): SDKRequestData<M, P> => {
    const id = generateRequestId()

    return {
      id,
      method,
      params,
      env: {
        sdkVersion
      }
    }
  }

  static makeResponse = (
    id: RequestId,
    data: MethodToResponse[Methods],
    version: string
  ): SuccessResponse => ({
    id,
    success: true,
    version,
    data
  })

  static makeErrorResponse = (id: RequestId, error: string, version: string): ErrorResponse => ({
    id,
    success: false,
    error,
    version
  })
}

type MessageHandler = (
  msg: SDKMessageEvent
) =>
  | void
  | MethodToResponse[Methods]
  | ErrorResponse
  | Promise<MethodToResponse[Methods] | ErrorResponse | void>

export enum LegacyMethods {
  getEnvInfo = 'getEnvInfo'
}

export type SDKMethods = Methods | LegacyMethods

export class IFrameCommunicator {
  private iframeRef: HTMLIFrameElement | null
  private handlers = new Map<SDKMethods, MessageHandler>()

  constructor(iframeRef: HTMLIFrameElement | null) {
    this.iframeRef = iframeRef

    window.addEventListener('message', this.handleIncomingMessage)
  }

  on = (method: SDKMethods, handler: MessageHandler): void => {
    this.handlers.set(method, handler)
  }

  private isValidMessage = (msg: SDKMessageEvent): boolean => {
    if (msg.data.hasOwnProperty('isCookieEnabled')) {
      return true
    }

    const sentFromIframe = this.iframeRef?.contentWindow === msg.source
    const knownMethod = Object.values(Methods).includes(msg.data.method)

    return sentFromIframe && knownMethod
  }

  private canHandleMessage = (msg: SDKMessageEvent): boolean => {
    return Boolean(this.handlers.get(msg.data.method))
  }

  send = (data: unknown, requestId: RequestId, error = false): void => {
    const msg = error
      ? MessageFormatter.makeErrorResponse(requestId, data as string, sdkVersion)
      : MessageFormatter.makeResponse(requestId, data, sdkVersion)
    // console.log("send", { msg });
    this.iframeRef?.contentWindow?.postMessage(msg, '*')
  }

  handleIncomingMessage = async (msg: SDKMessageEvent): Promise<void> => {
    const validMessage = this.isValidMessage(msg)
    const hasHandler = this.canHandleMessage(msg)

    if (validMessage && hasHandler) {
      // console.log("incoming", { msg: msg.data });

      const handler = this.handlers.get(msg.data.method)
      try {
        // @ts-expect-error Handler existence is checked in this.canHandleMessage
        const response = await handler(msg)

        // If response is not returned, it means the response will be send somewhere else
        if (typeof response !== 'undefined') {
          this.send(response, msg.data.id)
        }
      } catch (err: any) {
        this.send(err.message, msg.data.id, true)
      }
    }
  }

  clear = (): void => {
    window.removeEventListener('message', this.handleIncomingMessage)
  }
}
