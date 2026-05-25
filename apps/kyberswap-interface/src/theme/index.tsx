import React from 'react'

import { ThemeContext } from 'hooks/useTheme'
import { colors } from 'theme/color'

export * from 'theme/components'

export const MEDIA_WIDTHS = {
  upToXXSmall: 420,
  upToExtraSmall: 576,
  upToSmall: 768,
  upToMedium: 992,
  upToLarge: 1200,
  upToXL: 1400,
  upToXXL: 1800,
}

// `colors()` returns a static object derived from CSS tokens; freeze a single instance.
const themeValue = colors()

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
}
