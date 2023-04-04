import { Trans, t } from '@lingui/macro'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import SlippageControl from 'components/SlippageControl'
import PinButton from 'components/swapv2/SwapSettingsPanel/PinButton'
import SettingLabel from 'components/swapv2/SwapSettingsPanel/SettingLabel'
import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP } from 'constants/index'
import { useAppSelector } from 'state/hooks'
import { useCheckStablePairSwap } from 'state/swap/hooks'
import { pinSlippageControl } from 'state/user/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { SLIPPAGE_STATUS, checkRangeSlippage } from 'utils/slippage'

export const InfoHelperForMaxSlippage = () => {
  return (
    <InfoHelper
      size={12}
      width="320px"
      placement="top"
      text={
        <Text>
          <Trans>
            During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
            <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact">
              here ↗
            </ExternalLink>
            .
          </Trans>
        </Text>
      }
    />
  )
}

const Message = styled.div`
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;

  &[data-warning='true'] {
    color: ${({ theme }) => theme.warning};
  }

  &[data-error='true'] {
    color: ${({ theme }) => theme.red1};
  }
`

type Props = {
  shouldShowPinButton?: boolean
}

const SlippageSetting: React.FC<Props> = ({ shouldShowPinButton = true }) => {
  const dispatch = useDispatch()
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()
  const isStablePairSwap = useCheckStablePairSwap()
  const slippageStatus = checkRangeSlippage(rawSlippage, isStablePairSwap)
  const isWarning = slippageStatus !== SLIPPAGE_STATUS.NORMAL

  const isSlippageControlPinned = useAppSelector(state => state.user.isSlippageControlPinned)

  const handleClickPinSlippageControl = () => {
    dispatch(pinSlippageControl(!isSlippageControlPinned))
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        rowGap: '8px',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
        }}
      >
        <SettingLabel>
          <Trans>Max Slippage</Trans>
        </SettingLabel>
        <InfoHelperForMaxSlippage />

        {shouldShowPinButton && (
          <PinButton isActive={isSlippageControlPinned} onClick={handleClickPinSlippageControl} />
        )}
      </Flex>

      <SlippageControl
        rawSlippage={rawSlippage}
        setRawSlippage={setRawSlippage}
        isWarning={isWarning}
        defaultRawSlippage={isStablePairSwap ? DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP : DEFAULT_SLIPPAGE}
      />

      {isWarning && (
        <Message data-warning={true} data-error={false}>
          {slippageStatus === SLIPPAGE_STATUS.HIGH
            ? t`Slippage is high. Your transaction may be front-run.`
            : t`Slippage is low. Your transaction may fail.`}
        </Message>
      )}
    </Flex>
  )
}

export default SlippageSetting
