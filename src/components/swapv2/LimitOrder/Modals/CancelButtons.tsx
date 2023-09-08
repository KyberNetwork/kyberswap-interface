import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { GasStation } from 'components/Icons'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const ButtonWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

const CancelButtons = ({
  cancelStatus,
  onOkay,
  onClickHardCancel,
  onClickGaslessCancel,
  loading,
  supportCancelGasless,
  isEdit,
  isCancelAll,
  totalOrder,
  disabledGasLessCancel = false,
  disabledHardCancel = false,
}: {
  cancelStatus: CancelStatus
  onOkay: () => void
  onClickGaslessCancel: () => void
  onClickHardCancel: () => void
  loading: boolean
  supportCancelGasless: boolean
  isEdit?: boolean // else cancel
  isCancelAll?: boolean
  totalOrder?: ReactNode
  disabledGasLessCancel?: boolean
  disabledHardCancel?: boolean
}) => {
  const theme = useTheme()
  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
  const isTimeout = cancelStatus === CancelStatus.TIMEOUT
  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE

  return (
    <ButtonWrapper style={{ justifyContent: isTimeout ? 'flex-end' : undefined }}>
      {isCancelDone ? (
        <ButtonLight onClick={onOkay} height={'40px'} width={'100%'}>
          <Check size={18} /> &nbsp;<Trans>Okay</Trans>
        </ButtonLight>
      ) : isTimeout ? (
        <ButtonLight onClick={onClickGaslessCancel} height={'40px'} width={'100px'}>
          <Trans>Try Again</Trans>
        </ButtonLight>
      ) : (
        <>
          <Column width={'100%'} gap="8px">
            <ButtonLight
              disabled={disabledGasLessCancel || (isCountDown ? false : !supportCancelGasless || loading)}
              onClick={isCountDown ? onOkay : onClickGaslessCancel}
              height={'40px'}
              width={'100%'}
            >
              {isCountDown ? <Check size={18} /> : <GasLessIcon />}
              &nbsp;
              {isCountDown ? (
                <Trans>Okay</Trans>
              ) : isCancelAll ? (
                totalOrder
              ) : isEdit ? (
                <Trans>Edit (gasless)</Trans>
              ) : (
                <Trans>Cancel (gasless)</Trans>
              )}
            </ButtonLight>
            <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
              {isEdit ? <Trans>Edit the order without paying gas.</Trans> : <Trans>Cancel without paying gas.</Trans>}
              <Trans>
                <br /> Cancellation may not be instant. <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
              </Trans>
            </Text>
          </Column>
          <Column width={'100%'} gap="8px">
            <ButtonLight
              color={theme.red}
              disabled={loading || disabledHardCancel}
              onClick={onClickHardCancel}
              style={{ height: '40px', width: '100%' }}
            >
              <GasStation size={20} />
              &nbsp;
              {isCountDown ? (
                isEdit ? (
                  <Trans>Hard Edit Instead</Trans>
                ) : (
                  <Trans>Hard Cancel Instead</Trans>
                )
              ) : isCancelAll ? (
                <Trans>Hard Cancel all orders</Trans>
              ) : isEdit ? (
                <Trans>Hard Edit</Trans>
              ) : (
                <Trans>Hard Cancel</Trans>
              )}
            </ButtonLight>
            <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
              {isEdit ? (
                <Trans>Edit immediately by paying gas fees. </Trans>
              ) : (
                <Trans>Cancel immediately by paying gas fees. </Trans>
              )}{' '}
              <ExternalLink href="/todo">
                <Trans>Learn more ↗︎</Trans>
              </ExternalLink>
            </Text>
          </Column>
        </>
      )}
    </ButtonWrapper>
  )
}

export default CancelButtons
