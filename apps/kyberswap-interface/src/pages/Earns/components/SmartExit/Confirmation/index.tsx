import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Condition from 'pages/Earns/components/SmartExit/Confirmation/Condition'
import MoreInfo from 'pages/Earns/components/SmartExit/Confirmation/MoreInfo'
import Success from 'pages/Earns/components/SmartExit/Confirmation/Success'
import { SMART_EXIT_ADDRESS } from 'pages/Earns/constants'
import { ConditionType, ParsedPosition, SelectedMetric } from 'pages/Earns/types'

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
}) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { permitState, signPermitNft, permitData } = usePermitNft({
    contractAddress: position.id.split('-')[0],
    tokenId: position.tokenId,
    spender: SMART_EXIT_ADDRESS,
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

      <Condition position={position} selectedMetrics={selectedMetrics} conditionType={conditionType} />
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
