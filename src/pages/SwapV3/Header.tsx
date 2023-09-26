import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { Dispatch, RefObject, SetStateAction, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ColumnCenter } from 'components/Column'
import { RowBetween } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { TAB } from 'pages/SwapV3'
import HeaderRightMenu from 'pages/SwapV3/HeaderRightMenu'
import Tabs from 'pages/SwapV3/Tabs'
import { useDegenModeManager } from 'state/user/hooks'
import { CloseIcon } from 'theme'

const DegenBanner = styled(RowBetween)`
  padding: 10px 16px;
  background-color: ${({ theme }) => rgba(theme.warning, 0.3)};
  border-radius: 24px;
`

export default function Header({
  activeTab,
  setActiveTab,
  swapActionsRef,
}: {
  activeTab: TAB
  setActiveTab: Dispatch<SetStateAction<TAB>>
  swapActionsRef: RefObject<HTMLDivElement>
}) {
  const theme = useTheme()
  const [isDegenMode] = useDegenModeManager()
  const [isShowDegenBanner, setShowDegenBanner] = useState(true)
  const { pathname } = useLocation()

  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)

  return (
    <>
      <ColumnCenter gap="sm">
        <RowBetween>
          <Tabs activeTab={activeTab} />
          <HeaderRightMenu activeTab={activeTab} setActiveTab={setActiveTab} swapActionsRef={swapActionsRef} />
        </RowBetween>
        <RowBetween>
          <Text fontSize={12} color={theme.subText}>
            {isLimitPage
              ? t`Buy or sell tokens at customized prices`
              : isSwapPage
              ? t`Instantly buy or sell tokens at superior prices`
              : t`Swap between tokens on different chains`}
          </Text>
        </RowBetween>
      </ColumnCenter>
      {isDegenMode && isShowDegenBanner && (
        <DegenBanner>
          <Text fontSize={12} fontWeight={400} color={theme.text}>
            <Trans>You have turned on Degen Mode. Be cautious</Trans>
          </Text>
          <CloseIcon size={14} onClick={() => setShowDegenBanner(false)} />
        </DegenBanner>
      )}
    </>
  )
}
