import { ThemeContext, DefaultTheme } from 'styled-components'
import { useContext, Context } from 'react'

export default function useTheme() {
  return useContext(ThemeContext as Context<DefaultTheme>)
}
