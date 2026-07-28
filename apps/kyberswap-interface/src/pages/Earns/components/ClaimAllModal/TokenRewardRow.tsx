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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <TokenLogo src={token.logo} size={16} alt={token.symbol} />
        <TokenLogo
          src={chainLogo}
          size={10}
          alt={chainName}
          translateLeft
          style={{ position: 'relative', top: 4, border: `1px solid ${theme.black}` }}
        />
        <span className="ml-1">{formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })}</span>
        <span>{token.symbol}</span>
      </div>
      <span className="text-subText">
        {formatDisplayNumber(token.claimableUsdValue, { significantDigits: 4, style: 'currency' })}
      </span>
    </div>
  )
}
