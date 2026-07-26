import { useEffect, useRef, useState } from 'react'
import { postSyncMessage, subscribeSyncChannel } from '../store/syncChannel'
import type { PresenterState } from '../types/sync'
import type { ReelItem } from '../types/spin'

type PresenterExtras = 'presenterTextScale' | 'idleItems'

export interface PresenterViewState extends PresenterState {
  /** True when this result should render already landed with no animation — a presenter that joined after the spin had already resolved elsewhere. */
  instant: boolean
  /** Multiplier on the auto-computed row height, set from the control window — see PresenterView. */
  presenterTextScale: number
  /** Static preview of the current pool, shown while idle — see PresenterView/ControlPanel's idleItems. */
  idleItems: ReelItem[]
}

const IDLE_STATE: Omit<PresenterViewState, PresenterExtras> = { status: 'idle', instant: false }

/**
 * Presenter window state, driven entirely by messages from the control
 * window — never computed locally. Tracks the last spin id it has actually
 * started animating for, so a 'state-sync' that merely *confirms* a spin
 * already in progress (same spinId) doesn't hand the reel a fresh
 * BroadcastChannel-cloned `sequence` object and make it restart the
 * animation from scratch right as it should be landing.
 *
 * `presenterTextScale` is tracked as separate state from the spin machine
 * above — it's an independent, orthogonal setting, and folding it into the
 * same `setState` calls would risk it getting reset back to its default
 * every time a spin/reset message arrives instead of persisting across them.
 */
export function usePresenterSync(): PresenterViewState {
  const [state, setState] = useState<Omit<PresenterViewState, PresenterExtras>>(IDLE_STATE)
  const [presenterTextScale, setPresenterTextScale] = useState(1)
  const [idleItems, setIdleItems] = useState<ReelItem[]>([])
  const knownSpinIdRef = useRef<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeSyncChannel((message) => {
      switch (message.type) {
        case 'spin-start': {
          knownSpinIdRef.current = message.payload.spinId
          setState({ status: 'spinning', lastResult: message.payload, instant: false })
          break
        }

        case 'state-sync': {
          const { payload } = message
          if (!payload.lastResult) {
            knownSpinIdRef.current = null
            setState({ status: payload.status, instant: false })
            break
          }

          if (knownSpinIdRef.current === payload.lastResult.spinId) {
            // Same spin we're already showing — keep our existing `lastResult`
            // reference (and thus the in-flight reel animation) untouched.
            setState((prev) => ({
              status: payload.status,
              lastResult: prev.lastResult ?? payload.lastResult,
              instant: prev.instant,
            }))
          } else {
            // A spin we never got 'spin-start' for — we joined late. If it's
            // already decided, land on it instantly instead of replaying a
            // multi-second animation for a result that's already history.
            knownSpinIdRef.current = payload.lastResult.spinId
            setState({
              status: payload.status,
              lastResult: payload.lastResult,
              instant: payload.status === 'result',
            })
          }
          break
        }

        case 'settings-update':
          setPresenterTextScale(message.payload.presenterTextScale)
          break

        case 'idle-items-update':
          setIdleItems(message.payload.items)
          break

        case 'reset':
          knownSpinIdRef.current = null
          setState(IDLE_STATE)
          break
      }
    })
    postSyncMessage({ type: 'presenter-ready' })
    return unsubscribe
  }, [])

  return { ...state, presenterTextScale, idleItems }
}
