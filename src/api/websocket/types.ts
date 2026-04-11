import type { ServerMessage } from './protocol';

export type MessageHandler = (_message: ServerMessage) => void;
export type EventCallback = (_data?: unknown) => void;
export interface RegistrationCleanup {
  (): void;
}
