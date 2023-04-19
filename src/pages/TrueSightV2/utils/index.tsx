import { DefaultTheme } from 'styled-components'

export const calculateValueToColor = (value: number, theme: DefaultTheme) => {
  if (value < 20) {
    return theme.red
  }
  if (value < 40) {
    return '#FFA7C3'
  }
  if (value < 60) {
    return theme.text
  }
  if (value < 80) {
    return '#8DE1C7'
  }
  return theme.primary
}
