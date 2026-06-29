import { useSyncExternalStore } from 'react'

// Bridges the MetaMask SDK's mobile `preferredOpenLink` callback (which runs outside React,
// in the wagmi connector config) to the wallet modal. The SDK hands us the connection deep
// link asynchronously, after the relay handshake; we surface it here so the modal can render
// a real anchor the user taps. A genuine tap is what lets iOS resolve the Universal Link to
// an installed MetaMask (and fall back to the store otherwise) — opening it programmatically
// from this callback does not, because no user gesture is active.

let currentLink: string | null = null
const listeners = new Set<() => void>()

export function setMetaMaskMobileLink(link: string | null) {
  if (currentLink === link) return
  currentLink = link
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return currentLink
}

export function useMetaMaskMobileLink(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
