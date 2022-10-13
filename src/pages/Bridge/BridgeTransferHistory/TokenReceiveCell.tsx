import { Text } from 'rebass'

import { BridgeTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import useGetSingleBridgeTransfer from 'hooks/bridge/useGetSingleBridgeTransfer'

import { getAmountReceive, getTokenSymbol } from '../utils'

type Props = {
  transfer: BridgeTransfer
}

const TokenReceiveCell: React.FC<Props> = ({ transfer }) => {
  const amount = getAmountReceive(transfer.formatvalue, transfer.formatswapvalue, transfer.swapvalue)
  const symbol = getTokenSymbol(transfer)

  const { data, isValidating, error } = useGetSingleBridgeTransfer(transfer.txid, !!amount)

  if (isValidating) {
    return (
      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        -
      </Text>
    )
  }

  const getDisplayedAmount = () => {
    if (amount) {
      return amount
    }

    if (data && !error) {
      const transferDetail = data.info
      return getAmountReceive(transferDetail.formatvalue, transferDetail.formatswapvalue, transferDetail.swapvalue)
    }

    return '0.00'
  }

  return (
    <Text
      as="span"
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
      }}
    >
      {getDisplayedAmount()} {symbol}
    </Text>
  )
}

export default TokenReceiveCell
