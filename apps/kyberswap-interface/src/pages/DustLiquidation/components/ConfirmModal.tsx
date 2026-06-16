import { Trans } from '@lingui/macro'
import { HTMLAttributes } from 'react'
import { CheckCircle } from 'react-feather'
import { DustSwapRouteApiResponse } from 'services/dustSwap'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { useDustLiquidationState } from 'state/dustLiquidation/hooks'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

import useDustExecute from '../hooks/useDustExecute'

const Wrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full flex-col gap-4 p-5', className)} {...rest} />
)

const Title = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('m-0 text-[18px] font-medium text-text', className)} {...rest} />
)

const Summary = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 rounded-xl bg-buttonBlack px-4 py-3 text-[13px]', className)} {...rest} />
)

const Row = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex justify-between text-subText', className)} {...rest} />
)

const Strong = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('font-medium text-text', className)} {...rest} />
)

const StatusBox = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col items-center gap-2 py-4 text-center', className)} {...rest} />
)

const ErrorText = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-center text-[13px] text-red1', className)} {...rest} />
)

const PathBadge = ({ atomic, className, ...rest }: HTMLAttributes<HTMLSpanElement> & { atomic?: boolean }) => (
  <span
    className={cn(
      'ml-2 inline-block rounded-full px-2 py-0.5 text-[11px]',
      atomic ? 'bg-primary text-background' : 'bg-buttonGray text-subText',
      className,
    )}
    {...rest}
  />
)

type Props = {
  isOpen: boolean
  onDismiss: () => void
  route: DustSwapRouteApiResponse | undefined
  onSuccess: () => void
}

const usd = (v?: string) => {
  if (!v) return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return '-'
  return formatDisplayNumber(n, { style: 'currency', significantDigits: 4 })
}

const ConfirmModal = ({ isOpen, onDismiss, route, onSuccess }: Props) => {
  const { chainId } = useActiveWeb3React()
  const { inputs, outputToken, slippage } = useDustLiquidationState()
  const { execute, status, error, txHash, path, approvalProgress, reset } = useDustExecute({ route })

  const details = route?.data?.zapDetails
  const inputCount = inputs.filter(i => i.amount && Number(i.amount) > 0).length

  const handleClose = () => {
    if (status === 'success') onSuccess()
    if (status === 'idle' || status === 'success' || status === 'error') {
      reset()
      onDismiss()
    }
  }

  const renderBody = () => {
    if (status === 'building') {
      return (
        <StatusBox>
          <Loader />
          <span>
            <Trans>Preparing transaction…</Trans>
          </span>
        </StatusBox>
      )
    }
    if (status === 'approving') {
      return (
        <StatusBox>
          <Loader />
          <span>
            <Trans>
              Approving tokens ({approvalProgress?.current ?? 0}/{approvalProgress?.total ?? 0})…
            </Trans>
          </span>
        </StatusBox>
      )
    }
    if (status === 'submitting') {
      return (
        <StatusBox>
          <Loader />
          <span>
            <Trans>Confirm in your wallet…</Trans>
          </span>
          {path && <PathBadge atomic={path === 'atomic'}>{path === 'atomic' ? 'EIP-5792' : 'Sequential'}</PathBadge>}
        </StatusBox>
      )
    }
    if (status === 'pending') {
      return (
        <StatusBox>
          <Loader />
          <span>
            <Trans>Transaction pending…</Trans>
          </span>
          {txHash && (
            <ExternalLink href={getEtherscanLink(chainId, txHash, 'transaction')}>
              <Trans>View on explorer</Trans>
            </ExternalLink>
          )}
        </StatusBox>
      )
    }
    if (status === 'success') {
      return (
        <StatusBox>
          <CheckCircle size={40} className="text-primary" />
          <span className="font-medium">
            <Trans>Liquidation complete</Trans>
          </span>
          {txHash && (
            <ExternalLink href={getEtherscanLink(chainId, txHash, 'transaction')}>
              <Trans>View on explorer</Trans>
            </ExternalLink>
          )}
        </StatusBox>
      )
    }

    return (
      <>
        <Summary>
          <Row>
            <span>
              <Trans>Tokens in</Trans>
            </span>
            <Strong>{inputCount}</Strong>
          </Row>
          <Row>
            <span>
              <Trans>Total input</Trans>
            </span>
            <Strong>{usd(details?.initialAmountUsd)}</Strong>
          </Row>
          <Row>
            <span>
              <Trans>You receive</Trans>
            </span>
            <Strong>
              {outputToken?.symbol} ≈ {usd(details?.finalAmountUsd)}
            </Strong>
          </Row>
          <Row>
            <span>
              <Trans>Slippage</Trans>
            </span>
            <Strong>{(slippage / 100).toFixed(2)}%</Strong>
          </Row>
        </Summary>
        {error && <ErrorText>{error}</ErrorText>}
      </>
    )
  }

  const isWorking = status === 'building' || status === 'approving' || status === 'submitting' || status === 'pending'

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} maxWidth={460}>
      <Wrapper>
        <div className="flex items-center justify-between">
          <Title>
            <Trans>Confirm Liquidation</Trans>
          </Title>
        </div>

        {renderBody()}

        {!isWorking && status !== 'success' && (
          <div className="flex gap-3">
            <ButtonOutlined onClick={handleClose}>
              <Trans>Cancel</Trans>
            </ButtonOutlined>
            <ButtonPrimary onClick={execute} disabled={!route?.data}>
              {status === 'error' ? <Trans>Retry</Trans> : <Trans>Confirm</Trans>}
            </ButtonPrimary>
          </div>
        )}

        {status === 'success' && (
          <ButtonPrimary onClick={handleClose}>
            <Trans>Done</Trans>
          </ButtonPrimary>
        )}
      </Wrapper>
    </Modal>
  )
}

export default ConfirmModal
