import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import { Flex, Text } from 'rebass'

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
        alignItems: 'center',
        cursor: 'pointer',
        gap: '4px',
      }}
      role="button"
      onClick={() => {
        setOpen(true)
      }}
    >
      <Share2 size="12px" />
      <Text>
        <Trans>Share</Trans>
      </Text>

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
