import { APP_CONFIG } from '../config/wheelConfig'
import type {
  PresenterState,
  SettingsUpdatePayload,
  SpinBroadcastPayload,
  SpinProgressPayload,
  SyncMessage,
} from '../types/sync'

let channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel {
  channel ??= new BroadcastChannel(APP_CONFIG.syncChannelName)
  return channel
}

export function postSyncMessage(message: SyncMessage): void {
  getChannel().postMessage(message)
}

export function broadcastSpinStart(payload: SpinBroadcastPayload): void {
  postSyncMessage({ type: 'spin-start', payload })
}

export function broadcastSpinProgress(payload: SpinProgressPayload): void {
  postSyncMessage({ type: 'spin-progress', payload })
}

export function broadcastReset(): void {
  postSyncMessage({ type: 'reset' })
}

export function broadcastStateSync(payload: PresenterState): void {
  postSyncMessage({ type: 'state-sync', payload })
}

export function broadcastSettingsUpdate(payload: SettingsUpdatePayload): void {
  postSyncMessage({ type: 'settings-update', payload })
}

/** Returns an unsubscribe function. */
export function subscribeSyncChannel(handler: (message: SyncMessage) => void): () => void {
  const ch = getChannel()
  const listener = (event: MessageEvent<SyncMessage>) => handler(event.data)
  ch.addEventListener('message', listener)
  return () => ch.removeEventListener('message', listener)
}
