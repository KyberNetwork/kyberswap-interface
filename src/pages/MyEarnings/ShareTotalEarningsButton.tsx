import { t } from '@lingui/macro'
import { useState } from 'react'
import { Share2 } from 'react-feather'
import { Flex } from 'rebass'

import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import ShareModal from 'pages/MyEarnings/ShareModal'

type Props = {
  totalValue: number
}
const ShareTotalEarningsButton: React.FC<Props> = ({ totalValue }) => {
  const theme = useTheme()
  const [isOpen, setOpen] = useState(false)
  const { mixpanelHandler } = useMixpanel()

  return (
    <Flex
      sx={{
        flex: '0 0 36px',
        alignItems: 'center',
        justifyContent: 'center',
        height: '36px',
        borderRadius: '999px',
        color: theme.subText,
        background: theme.background,
        cursor: 'pointer',
      }}
      role="button"
      onClick={() => {
        mixpanelHandler(MIXPANEL_TYPE.EARNING_DASHBOARD_CLICK_TOP_LEVEL_SHARE_BUTTON)
        setOpen(true)
      }}
    >
      <Share2 size="16px" />

      <ShareModal title={t`My Total Earnings`} value={totalValue} isOpen={isOpen} setIsOpen={setOpen} />
    </Flex>
  )
}

export default ShareTotalEarningsButton
