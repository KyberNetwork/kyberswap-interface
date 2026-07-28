import Logo from 'components/Logo'

type Props = {
  symbol: string
  logoUrl?: string
  amount?: string
}
const TokenInlineDisplay: React.FC<Props> = ({ symbol, logoUrl = '', amount }) => {
  return (
    <span className="inline-flex flex-nowrap items-center gap-1">
      <Logo srcs={[logoUrl]} className="size-4 rounded-full" />
      <span className="text-sm font-medium text-text">
        {amount} {symbol}
      </span>
    </span>
  )
}

export default TokenInlineDisplay
