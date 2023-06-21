import { useTheme } from 'styled-components'

export default function DextoolsWidget() {
  const theme = useTheme()
  return (
    <iframe
      id="dextools-widget"
      title="DEXTools Trading Chart"
      width="100%"
      height="100%"
      src={`https://www.dextools.io/widgets/en/ether/pe-light/0xa29fe6ef9592b5d408cca961d0fb9b1faf497d6d?theme=${
        theme.darkMode ? 'dark' : 'light'
      }&chartType=2&chartResolution=30&drawingToolbars=true`}
    ></iframe>
  )
}
