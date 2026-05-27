import { Trans, t } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetSmartExitConfigQuery } from 'services/smartExit'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Condition from 'pages/Earns/components/SmartExit/Confirmation/Condition'
import MoreInfo from 'pages/Earns/components/SmartExit/Confirmation/MoreInfo'
import Success from 'pages/Earns/components/SmartExit/Confirmation/Success'
import { ConditionType, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { useNotify } from 'state/application/hooks'

export default function Confirmation({
  selectedMetrics,
  position,
  deadline,
  conditionType,
  feeSettings: { protocolFee, maxGas },
  onDismiss,
  onCloseSmartExit,
  createSmartExitOrder,
  isCreating,
  isSuccess,
  revertPrice = false,
}: {
  selectedMetrics: SelectedMetric[]
  position: ParsedPosition
  conditionType: ConditionType
  deadline: number
  feeSettings: { protocolFee: number; maxGas: number }
  onDismiss: () => void
  onCloseSmartExit: () => void
  createSmartExitOrder: (opts: { maxGas: number; permitData: string }) => Promise<boolean>
  isCreating: boolean
  isSuccess: boolean
  revertPrice?: boolean
}) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const notify = useNotify()
  const { data: smartExitConfig } = useGetSmartExitConfigQuery(position.chain.id)
  const { permitState, signPermitNft, permitData } = usePermitNft({
    contractAddress: position.positionId.split('-')[0],
    tokenId: position.tokenId,
    spender: smartExitConfig?.smartIntentAddress ?? '',
    deadline,
  })

  if (isSuccess) return <Success onDismiss={onDismiss} onCloseSmartExit={onCloseSmartExit} />

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Flex alignItems="center" sx={{ gap: '8px' }}>
          <IconArrowLeft onClick={onDismiss} />
          <Text fontSize={20} fontWeight={500}>
            <Trans>Confirmation</Trans>
          </Text>
        </Flex>
        <X onClick={onDismiss} />
      </Flex>

      <Condition
        position={position}
        selectedMetrics={selectedMetrics}
        conditionType={conditionType}
        revertPrice={revertPrice}
      />
      <MoreInfo deadline={deadline} protocolFee={protocolFee} maxGas={maxGas} />

      <Text fontStyle="italic" fontSize={14} color={theme.subText} my="1rem">
        <Trans>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </Trans>
      </Text>

      <ButtonPrimary
        disabled={Boolean(permitState === PermitNftState.SIGNING || isCreating || !maxGas)}
        onClick={async () => {
          if (!maxGas) return
          if (chainId !== position.chain.id) {
            changeNetwork(position.chain.id)
            return
          }

          if (isSmartConnector) {
            // Smart wallets produce EIP-1271 signatures that the NFT contract's
            // ecrecover-based permit can't verify, so the order would fail on
            // execution even if we let it sign here.
            notify({
              type: NotificationType.ERROR,
              title: t`Smart Wallet not supported`,
              summary: t`Smart Exit requires a regular EOA wallet (e.g. MetaMask, Rabby) to sign the position permit. Please reconnect with a non-smart wallet.`,
            })
            return
          }

          if (permitState !== PermitNftState.SIGNED || !permitData?.permitData) {
            await signPermitNft()
            return
          }

          await createSmartExitOrder({ maxGas, permitData: permitData.permitData })
        }}
      >
        {chainId !== position.chain.id ? (
          <Trans>Switch Network</Trans>
        ) : isCreating ? (
          <Trans>Creating Order...</Trans>
        ) : permitState === PermitNftState.SIGNED ? (
          <Trans>Confirm Smart Exit</Trans>
        ) : permitState === PermitNftState.SIGNING ? (
          <Trans>Signing...</Trans>
        ) : (
          <Trans>Permit NFT</Trans>
        )}
      </ButtonPrimary>
    </>
  )
}
