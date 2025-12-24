import { Flex, Text } from 'rebass'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { TokenRewardInfo } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

type TokenRewardRowProps = {
  token: TokenRewardInfo
  chainLogo: string
  chainName: string
}

export const TokenRewardRow = ({ token, chainLogo, chainName }: TokenRewardRowProps) => {
  const theme = useTheme()

  return (
    <Flex alignItems={'center'} justifyContent={'space-between'}>
      <Flex alignItems={'center'} sx={{ gap: 1 }}>
        <TokenLogo src={token.logo} size={16} alt={token.symbol} />
        <TokenLogo
          src={chainLogo}
          size={10}
          alt={chainName}
          translateLeft
          style={{ position: 'relative', top: 4, border: `1px solid ${theme.black}` }}
        />
        <Text marginLeft={1}>{formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })}</Text>
        <Text>{token.symbol}</Text>
      </Flex>
      <Text color={theme.subText}>
        {formatDisplayNumber(token.claimableUsdValue, { significantDigits: 4, style: 'currency' })}
      </Text>
    </Flex>
  )
}
