import { t } from '@lingui/macro'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import { Flex } from 'rebass'

import ShareModal from 'pages/MyEarnings/ShareModal'

type Props = {
  totalValue: number
  token0:
    | {
        symbol: string
        logoURI: string
      }
    | undefined
  token1:
    | {
        symbol: string
        logoURI: string
      }
    | undefined
  feePercent: string
}
const SharePoolEarningsButton: React.FC<Props> = ({ totalValue, token0, token1, feePercent }) => {
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
          token0 && token1 && feePercent
            ? {
                token0,
                token1,
                feePercent,
              }
            : undefined
        }
      />
    </Flex>
  )
}

export default SharePoolEarningsButton
