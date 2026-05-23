import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { isDustSwapSupported } from 'constants/dustLiquidation'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { getTokenLogoURL } from 'utils'

import ConfirmModal from './components/ConfirmModal'
import OutputSelector from './components/OutputSelector'
import RouteSummary from './components/RouteSummary'
import TokenMultiSelector from './components/TokenMultiSelector'
import useDustRoute from './hooks/useDustRoute'

const PageWrapper = styled.div`
  width: 100%;
  max-width: 580px;
  margin: 32px auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Card = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 4px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const Subtitle = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.subText};
  line-height: 1.4;
`

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.red1};
  font-size: 13px;
`

const DustLiquidation = () => {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const { inputs, outputToken } = useDustLiquidationState()
  const { reset } = useDustLiquidationActions()

  const supported = useMemo(() => isDustSwapSupported(chainId), [chainId])
  const [showConfirm, setShowConfirm] = useState(false)
  const { updateOutput } = useDustLiquidationActions()

  // Reset selections when wallet or chain changes, then seed a sensible default output
  // token for the new chain (matches swap page behavior).
  useEffect(() => {
    reset()
    if (!isDustSwapSupported(chainId)) return
    const defaultOut = DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId]
    if (!defaultOut) return
    updateOutput({
      address: defaultOut.address,
      symbol: defaultOut.symbol ?? '',
      decimals: defaultOut.decimals,
      logo: getTokenLogoURL(defaultOut.address, chainId),
    })
  }, [account, chainId, reset, updateOutput])

  const { route, isLoading: routeLoading, error: routeError, hint, refetch } = useDustRoute()

  const inputsReady = inputs.length > 0 && inputs.some(i => i.amount && Number(i.amount) > 0)
  const liquidateDisabled = !account || !outputToken || !inputsReady || routeLoading || !route?.data || !!routeError

  return (
    <PageWrapper>
      <PageHeader>
        <Title>
          <Trans>Dust Liquidation</Trans>
        </Title>
        <Subtitle>
          <Trans>Sweep multiple small token balances into a single token in one bundle.</Trans>
        </Subtitle>
      </PageHeader>

      {!supported ? (
        <Card>
          <ErrorText>
            <Trans>Dust Liquidation is not available on this network yet.</Trans>
          </ErrorText>
        </Card>
      ) : (
        <>
          <Card>
            <SectionLabel>
              <Trans>From — tokens to liquidate</Trans>
            </SectionLabel>
            <TokenMultiSelector />
          </Card>

          <Card>
            <Flex justifyContent="space-between" alignItems="center">
              <SectionLabel>
                <Trans>Receive as</Trans>
              </SectionLabel>
              <OutputSelector />
            </Flex>
          </Card>

          <RouteSummary route={route} loading={routeLoading} error={routeError} hint={hint} onRefresh={refetch} />

          {!account ? (
            <ButtonLight onClick={toggleWalletModal}>
              <Trans>Connect Wallet</Trans>
            </ButtonLight>
          ) : (
            <ButtonPrimary disabled={liquidateDisabled} onClick={() => setShowConfirm(true)}>
              {routeLoading ? <Trans>Fetching route…</Trans> : <Trans>Liquidate</Trans>}
            </ButtonPrimary>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        route={route}
        onSuccess={() => {
          setShowConfirm(false)
          reset()
        }}
      />
    </PageWrapper>
  )
}

export default DustLiquidation
