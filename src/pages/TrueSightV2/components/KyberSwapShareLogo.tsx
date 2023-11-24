import { ReactNode } from 'react'
import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'

const defaultWidth = 204
const defaultHeight = 72
// todo move
export default function KyberSwapShareLogo({ width = defaultWidth, title }: { width?: number; title?: ReactNode }) {
  const theme = useTheme()

  const scale = width / defaultWidth
  return (
    <div
      style={{
        width: defaultWidth,
        height: defaultHeight,
        transform: `scale(${scale})`,
        backgroundImage: `url(${'/logo-dark.svg'})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100%',
        position: 'relative',
      }}
    >
      <Text
        fontSize={'14px'}
        fontWeight={'500'}
        sx={{ position: 'absolute', right: 0, bottom: 0, width: 'fit-content', color: theme.subText }}
      >
        {title}
      </Text>
    </div>
  )
}
