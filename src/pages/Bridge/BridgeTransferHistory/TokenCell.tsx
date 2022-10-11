import { Text } from 'rebass'

type Props = {
  amount: string
  symbol: string
}

const TokenCell: React.FC<Props> = ({ amount, symbol }) => {
  return (
    <Text
      as="span"
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
      }}
    >
      {amount} {symbol}
    </Text>
  )
}

export default TokenCell
