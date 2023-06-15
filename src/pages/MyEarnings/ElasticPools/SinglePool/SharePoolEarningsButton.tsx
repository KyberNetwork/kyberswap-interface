import { t } from '@lingui/macro'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import { Flex } from 'rebass'

import ShareModal from 'pages/MyEarnings/ShareModal'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

type Props = {
  totalValue: number
  currency0: WrappedTokenInfo | undefined
  currency1: WrappedTokenInfo | undefined
  feePercent: string
}
const SharePoolEarningsButton: React.FC<Props> = ({ totalValue, currency0, currency1, feePercent }) => {
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
                feePercent,
              }
            : undefined
        }
      />
    </Flex>
  )
}

export default SharePoolEarningsButton
