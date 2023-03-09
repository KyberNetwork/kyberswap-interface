import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'

type Props = {
  symbol: string
  logoUrl?: string
  amount?: string
}
const TokenInlineDisplay: React.FC<Props> = ({ symbol, logoUrl, amount }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'nowrap',
      }}
    >
      {logoUrl && <img alt="KNC" width="16px" height="16px" src={logoUrl} />}
      <Text
        sx={{
          fontWeight: 500,
          color: theme.text,
          fontSize: '14px',
        }}
      >
        {amount} {symbol}
      </Text>
    </Flex>
  )
}

export default TokenInlineDisplay
