import { Trans } from '@lingui/macro'
import { HTMLAttributes, useEffect, useMemo, useState } from 'react'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { isDustSwapSupported } from 'constants/dustLiquidation'
import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { useDustLiquidationActions, useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { getTokenLogoURL } from 'utils'
import { cn } from 'utils/cn'

import ConfirmModal from './components/ConfirmModal'
import OutputSelector from './components/OutputSelector'
import RouteSummary from './components/RouteSummary'
import TokenMultiSelector from './components/TokenMultiSelector'
import useDustRoute from './hooks/useDustRoute'

const PageWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mx-auto my-8 flex w-full max-w-[580px] flex-col gap-4 px-4', className)} {...rest} />
)

const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-3.5 rounded-[20px] bg-background p-5', className)} {...rest} />
)

const PageHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 px-1', className)} {...rest} />
)

const Title = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className={cn('m-0 text-[22px] font-medium text-text', className)} {...rest} />
)

const Subtitle = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-[13px] leading-[1.4] text-subText', className)} {...rest} />
)

const SectionLabel = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-[13px] font-medium uppercase tracking-[0.5px] text-subText', className)} {...rest} />
)

const ErrorText = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-[13px] text-red1', className)} {...rest} />
)

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
            <div className="flex items-center justify-between">
              <SectionLabel>
                <Trans>Receive as</Trans>
              </SectionLabel>
              <OutputSelector />
            </div>
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
