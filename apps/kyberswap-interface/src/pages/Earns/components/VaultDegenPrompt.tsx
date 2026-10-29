import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/** Long enough for the row's pulse to play out — it runs twice, two seconds each way. */
const HIGHLIGHT_MS = 4_000

type VaultDegenPrompt = {
  /** The settings should be open with the Degen Mode row marked. */
  highlight: boolean
  /** An action refused to sign and is sending the person to the setting that would let it. */
  ask: () => void
}

const Context = createContext<VaultDegenPrompt>({ highlight: false, ask: () => undefined })

/**
 * Carries the one signal between an action button and the settings it points at. They sit on
 * opposite sides of the form — the button at its foot, the gear up on the tab row — so neither can
 * hold the state for the other.
 */
export const VaultDegenPromptProvider = ({ children }: { children: ReactNode }) => {
  const [highlight, setHighlight] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const ask = useCallback(() => {
    setHighlight(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setHighlight(false), HIGHLIGHT_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const value = useMemo(() => ({ highlight, ask }), [highlight, ask])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useVaultDegenPrompt = () => useContext(Context)
