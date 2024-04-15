import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { RefObject, useRef, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

import Toggle from 'components/Toggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

import DegenModeSetting from './DegenModeSetting'
import GasPriceTrackerSetting from './GasPriceTrackerSetting'
import LiquiditySourcesSetting from './LiquiditySourcesSetting'
import SlippageSetting from './SlippageSetting'
import TransactionTimeLimitSetting from './TransactionTimeLimitSetting'

type Props = {
  className?: string
  onBack: () => void
  onClickGasPriceTracker: () => void
  onClickLiquiditySources: () => void
  isSwapPage?: boolean
  isCrossChainPage?: boolean
  swapActionsRef: RefObject<HTMLDivElement>
}

const BackText = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const SettingsPanel: React.FC<Props> = ({
  isSwapPage,
  isCrossChainPage,
  className,
  onBack,
  onClickLiquiditySources,
  onClickGasPriceTracker,
  swapActionsRef,
}) => {
  const theme = useTheme()

  const [showConfirmation, setShowConfirmation] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside([containerRef, swapActionsRef], () => !showConfirmation && onBack())

  return (
    <Box width="100%" className={className} id={TutorialIds.TRADING_SETTING_CONTENT} ref={containerRef}>
      <Flex width={'100%'} flexDirection={'column'} marginBottom="4px">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <ChevronLeft onClick={onBack} color={theme.subText} cursor={'pointer'} size={26} />
          <BackText>{t`Settings`}</BackText>
        </Flex>

        <Flex
          sx={{
            marginTop: '22px',
            flexDirection: 'column',
            rowGap: '12px',
            width: '100%',
          }}
        >
          {(isSwapPage || isCrossChainPage) && (
            <>
              <span className="settingTitle">
                <Trans>Advanced Settings</Trans>
              </span>

              <SlippageSetting />
              {isSwapPage && <TransactionTimeLimitSetting />}
              <DegenModeSetting showConfirmation={showConfirmation} setShowConfirmation={setShowConfirmation} />
              {isSwapPage && (
                <>
                  <GasPriceTrackerSetting onClick={onClickGasPriceTracker} />
                  <LiquiditySourcesSetting onClick={onClickLiquiditySources} />
                </>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}

export default styled(SettingsPanel)`
  ${Toggle} {
    background: ${({ theme }) => theme.buttonBlack};
    &[data-active='true'] {
      background: ${({ theme }) => rgba(theme.primary, 0.2)};
    }
  }
`
