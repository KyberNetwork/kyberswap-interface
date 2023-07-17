import { RouteData } from '@0xsquid/sdk'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { NetworkLogo, TokenLogoWithChain } from 'components/Logo'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { TradeSummaryCrossChain } from 'components/swapv2/AdvancedSwapDetails'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import SwapBrief from 'pages/CrossChain/SwapBriefCrossChain'
import { getRouInfo } from 'pages/CrossChain/helpers'
import { OutputBridgeInfo, useBridgeState, useCrossChainState } from 'state/crossChain/hooks'
import { useDegenModeManager } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { TransactionFlowState } from 'types/TransactionFlowState'
import { formatNumberWithPrecisionRange, shortenAddress } from 'utils'
import { uint256ToFraction } from 'utils/numbers'

const Disclaimer = styled.div`
  padding: 8px;

  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 10px;
  line-height: 14px;
  font-weight: 400;

  border-radius: 16px;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.35)};
  color: ${({ theme }) => theme.text};
  accent-color: ${({ theme }) => theme.primary};

  cursor: pointer;
  transition: background-color 100ms linear;

  :hover {
    background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.5)};
  }
`

const Multichain = () => {
  return (
    <ExternalLink href="https://multichain.org/" onClick={e => e.stopPropagation()}>
      Multichain
    </ExternalLink>
  )
}

const Container = styled.div`
  padding: 20px;
  width: 100%;
`
const Row = styled.div`
  line-height: 16px;
  display: flex;
  justify-content: space-between;
  width: 100%;
`

const Value = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const Label = styled.div`
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: ${({ theme }) => theme.subText};
`

const SubLabel = styled.div`
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.subText};
`

const SubValue = styled.div`
  display: flex;
  align-items: center;

  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const formatValue = (amount: string) =>
  !amount ? '' : formatNumberWithPrecisionRange(parseFloat(amount.toString()), 0, 10)

const styleLogo = { width: 16, height: 16 }

export default memo(function ConfirmBridgeModal({
  onSwap,
  onDismiss,
  outputInfo,
  swapState,
}: {
  onSwap: () => void
  onDismiss: () => void
  outputInfo: OutputBridgeInfo
  swapState: TransactionFlowState
}) {
  const theme = useTheme()
  const [accepted, setAccepted] = useState(false)
  const { account, chainId } = useActiveWeb3React()
  const [{ chainIdOut, currencyIn, currencyOut }] = useBridgeState()
  const { mixpanelHandler } = useMixpanel()

  const handleClickDisclaimer = useCallback(() => {
    const newValue = !accepted
    setAccepted(newValue)
    mixpanelHandler(MIXPANEL_TYPE.BRIDGE_CLICK_DISCLAIMER, newValue)
  }, [accepted, mixpanelHandler])

  const listData = useMemo(() => {
    return [
      {
        label: t`I want to transfer`,
        content: (
          <Value>
            <CurrencyLogo currency={currencyIn} style={styleLogo} />
            <Text>
              {formatValue(outputInfo.inputAmount)} {currencyIn?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`from`,
        content: (
          <Value>
            <NetworkLogo chainId={chainId} style={styleLogo} />
            <span>{chainId && NETWORKS_INFO?.[chainId]?.name}</span>
          </Value>
        ),
      },
      {
        label: t`to`,
        content: (
          <Value>
            {chainIdOut && <NetworkLogo chainId={chainIdOut} style={styleLogo} />}
            {chainIdOut && <span>{NETWORKS_INFO[chainIdOut].name}</span>}
          </Value>
        ),
      },
      {
        label: t`and receive at least`,
        content: (
          <Value>
            <CurrencyLogo currency={currencyOut} style={styleLogo} />
            <span>
              {formatValue(outputInfo?.outputAmount?.toString())} {currencyOut?.symbol}
            </span>
          </Value>
        ),
      },
      {
        label: t`at this address`,
        content: account && (
          <Value>
            <span>{shortenAddress(chainId, account, 5)}</span>
            <CopyHelper toCopy={account} style={{ color: theme.subText }} />
          </Value>
        ),
      },
    ]
  }, [account, chainIdOut, chainId, currencyIn, currencyOut, outputInfo, theme])

  const confirmationContent = useCallback(
    () =>
      swapState.errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapState.errorMessage} />
      ) : (
        <Container>
          <Flex flexDirection={'column'} style={{ gap: '16px' }}>
            <Flex justifyContent={'space-between'} alignItems="center">
              <Text color={theme.text} fontSize={20}>{t`Review your transfer`}</Text>
              <X onClick={onDismiss} style={{ cursor: 'pointer' }} color={theme.text} />
            </Flex>

            <Flex sx={{ gap: '12px' }} flexDirection="column">
              {listData.map(item => (
                <Row key={item.label}>
                  <Label>{item.label}</Label>
                  {item.content}
                </Row>
              ))}
            </Flex>

            <Flex
              flexDirection={'column'}
              style={{
                borderRadius: 16,
                padding: '12px',
                border: `1px solid ${theme.border}`,
                gap: '12px',
                fontSize: '12px',
              }}
            >
              <Row>
                <SubLabel>
                  <Trans>Estimated Processing Time</Trans>
                </SubLabel>
                <SubValue>{outputInfo.time}</SubValue>
              </Row>
              <Row>
                <SubLabel>
                  <Trans>Transaction Fee</Trans>
                </SubLabel>
                <SubValue>{outputInfo.fee ? `~${outputInfo.fee} ${currencyIn?.symbol}` : '--'}</SubValue>
              </Row>
            </Flex>

            <Text fontSize={12} fontStyle="italic" color={theme.subText}>
              <Trans>Note: It may take upto 30 minutes for your transaction to show up under Transfer History</Trans>
            </Text>

            <Disclaimer role="button" onClick={handleClickDisclaimer}>
              <input
                onChange={() => {
                  // empty
                }}
                type="checkbox"
                checked={accepted}
                style={{ height: '16px', width: '16px', cursor: 'pointer' }}
              />
              <span>
                <Trans>
                  You agree that KyberSwap is using <Multichain /> to facilitate transfer of tokens between chains, and
                  in case of a security breach on Multichain, KyberSwap won&apos;t assume any liability for any losses
                </Trans>
              </span>
            </Disclaimer>

            <ButtonPrimary id="transfer-button" onClick={onSwap} disabled={!accepted}>
              <Trans>Transfer</Trans>
            </ButtonPrimary>
          </Flex>
        </Container>
      ),
    [
      accepted,
      currencyIn?.symbol,
      handleClickDisclaimer,
      listData,
      onDismiss,
      onSwap,
      outputInfo.fee,
      outputInfo.time,
      swapState.errorMessage,
      theme.border,
      theme.subText,
      theme.text,
    ],
  )

  useEffect(() => {
    if (!swapState.showConfirm) {
      setAccepted(false)
    }
  }, [swapState.showConfirm])

  return (
    <TransactionConfirmationModal
      hash={swapState.txHash}
      isOpen={swapState.showConfirm}
      onDismiss={onDismiss}
      attemptingTxn={swapState.attemptingTxn}
      content={confirmationContent}
      pendingText={
        chainId && chainIdOut
          ? t`Transferring ${currencyIn?.symbol} (${NETWORKS_INFO[chainId].name}) to ${currencyOut?.symbol} (${NETWORKS_INFO[chainIdOut].name})`
          : ''
      }
    />
  )
})

export const ConfirmCrossChainModal = memo(function ConfirmCrossChainModal({
  onSwap,
  onDismiss,
  swapState,
  route,
}: {
  onSwap: () => void
  onDismiss: () => void
  swapState: TransactionFlowState
  route: RouteData | undefined
}) {
  const theme = useTheme()
  const [accepted, setAccepted] = useState(false)
  const { chainId } = useActiveWeb3React()
  const [{ chainIdOut, currencyIn, currencyOut }] = useCrossChainState()
  const { inputAmount, outputAmount, priceImpact } = getRouInfo(route)
  const [isDegenMode] = useDegenModeManager()
  const { mixpanelHandler } = useMixpanel()

  const handleClickDisclaimer = useCallback(() => {
    const newValue = !accepted
    setAccepted(newValue)
    if (newValue) {
      mixpanelHandler(MIXPANEL_TYPE.CROSS_CHAIN_CLICK_DISCLAIMER_CHECKBOX, {
        input_token: currencyIn?.symbol,
        output_token: currencyOut?.symbol,
      })
    }
  }, [accepted, mixpanelHandler, currencyIn, currencyOut])

  const confirmationContent = useCallback(
    () =>
      swapState.errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapState.errorMessage} />
      ) : (
        <Container>
          <Flex flexDirection={'column'} style={{ gap: '16px' }}>
            <Flex justifyContent={'space-between'} alignItems="center">
              <Text color={theme.text} fontSize={20}>{t`Confirm Swap Details`}</Text>
              <X onClick={onDismiss} style={{ cursor: 'pointer' }} color={theme.text} />
            </Flex>

            <Text fontWeight={400} fontSize={12} color={theme.subText}>
              <Trans>Please review the details of your swap:</Trans>
            </Text>

            <SwapBrief route={route} />

            <TradeSummaryCrossChain
              route={route}
              showHeader={false}
              style={{ border: `1px solid ${theme.border}`, borderRadius: 16, padding: 12 }}
            />

            {!!priceImpact && <PriceImpactNote priceImpact={Number(priceImpact)} isDegenMode={isDegenMode} />}

            <Disclaimer role="button" onClick={handleClickDisclaimer}>
              <input
                onChange={() => {
                  // empty
                }}
                type="checkbox"
                checked={accepted}
                style={{ height: '16px', width: '16px', cursor: 'pointer' }}
              />
              <span>
                <Trans>
                  You agree that KyberSwap is using{' '}
                  <ExternalLink href="https://www.squidrouter.com/" onClick={e => e.stopPropagation()}>
                    Squid / Axelar
                  </ExternalLink>{' '}
                  to facilitate swap of tokens between chains, and in case of a security breach on Squid / Axelar,
                  KyberSwap won&apos;t assume any liability for any losses
                </Trans>
              </span>
            </Disclaimer>

            <SwapButtonWithPriceImpact
              text={t`Confirm Swap`}
              disabledText={t`Confirm Swap`}
              onClick={onSwap}
              disabled={!accepted}
              showLoading={false}
              priceImpact={priceImpact}
              isProcessingSwap={swapState.attemptingTxn}
              isApproved={true}
              route={route}
              minimal={false}
              showNoteGetRoute={false}
              showTooltipPriceImpact={false}
            />
          </Flex>
        </Container>
      ),
    [
      accepted,
      handleClickDisclaimer,
      onDismiss,
      onSwap,
      swapState.errorMessage,
      theme,
      route,
      isDegenMode,
      priceImpact,
      swapState.attemptingTxn,
    ],
  )

  useEffect(() => {
    if (!swapState.showConfirm) {
      setAccepted(false)
    }
  }, [swapState.showConfirm])

  return (
    <TransactionConfirmationModal
      hash={swapState.txHash}
      isOpen={swapState.showConfirm}
      onDismiss={onDismiss}
      attemptingTxn={swapState.attemptingTxn}
      content={confirmationContent}
      pendingText={
        chainId &&
        chainIdOut &&
        inputAmount &&
        outputAmount &&
        currencyIn &&
        currencyOut && (
          <Flex
            alignItems={'center'}
            color={theme.text}
            sx={{ rowGap: '6px', columnGap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <Flex sx={{ gap: '4px' }}>
              <TokenLogoWithChain currency={currencyIn} size={16} />
              &nbsp;
              {uint256ToFraction(inputAmount, currencyIn?.decimals).toSignificant(RESERVE_USD_DECIMALS)}
              <Text as="span"> {currencyIn?.symbol}</Text>
            </Flex>

            <ArrowRight size={14} />

            <Flex sx={{ gap: '4px' }}>
              <TokenLogoWithChain currency={currencyOut} size={16} />
              &nbsp;
              {uint256ToFraction(outputAmount, currencyOut?.decimals).toSignificant(RESERVE_USD_DECIMALS)}
              <Text as="span">{currencyOut?.symbol}</Text>
            </Flex>
          </Flex>
        )
      }
    />
  )
})
