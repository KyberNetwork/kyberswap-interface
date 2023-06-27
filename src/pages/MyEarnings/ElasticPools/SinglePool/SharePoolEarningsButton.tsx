import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import { Flex } from 'rebass'

import ShareModal from 'pages/MyEarnings/ShareModal'

type Props = {
  totalValue: number
  currency0: Currency | undefined
  currency1: Currency | undefined
  currency0Symbol: string
  currency1Symbol: string
  feePercent: string
}
const SharePoolEarningsButton: React.FC<Props> = ({
  totalValue,
  currency0,
  currency1,
  currency0Symbol,
  currency1Symbol,
  feePercent,
}) => {
  const [isOpen, setOpen] = useState(false)

  return (
    <Flex
      sx={{
        flex: '0 0 24px',
        alignItems: 'center',
        justifyContent: 'center',
        height: '24px',
        borderRadius: '999px',
      }}
      role="button"
      onClick={() => {
        setOpen(true)
      }}
    >
      <Share2 size="16px" />

      <ShareModal
        title={t`My Pool Earnings`}
        value={totalValue}
        isOpen={isOpen}
        setIsOpen={setOpen}
        poolInfo={
          currency0 && currency1 && feePercent
            ? {
                currency0,
                currency1,
                currency0Symbol,
                currency1Symbol,
                feePercent,
              }
            : undefined
        }
      />
    </Flex>
  )
}

export default SharePoolEarningsButton
