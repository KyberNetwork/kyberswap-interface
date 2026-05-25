import React, { useMemo } from 'react'

import { ThemeContext } from 'hooks/useTheme'
import { Colors, colors } from 'theme/color'

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

function theme(): Colors {
  return colors()
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => theme(), [])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
