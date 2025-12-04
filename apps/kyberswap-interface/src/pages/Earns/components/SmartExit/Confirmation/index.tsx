import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import Condition from 'pages/Earns/components/SmartExit/Confirmation/Condition'
import ExpectedAmount from 'pages/Earns/components/SmartExit/Confirmation/ExpectedAmount'
import MoreInfo from 'pages/Earns/components/SmartExit/Confirmation/MoreInfo'
import Success from 'pages/Earns/components/SmartExit/Confirmation/Success'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { SMART_EXIT_ADDRESS } from 'pages/Earns/constants'
import { ConditionType, ParsedPosition, SelectedMetric } from 'pages/Earns/types'

export default function Confirmation({
  selectedMetrics,
  position,
  deadline,
  conditionType,
  feeSettings: { protocolFee, maxFeesPercentage },
  onDismiss,
}: {
  selectedMetrics: SelectedMetric[]
  position: ParsedPosition
  conditionType: ConditionType
  deadline: number
  feeSettings: { protocolFee: number; maxFeesPercentage: number }
  onDismiss: () => void
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

  const { createSmartExitOrder, isCreating, isSuccess } = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
    permitData: permitData?.permitData,
    signature: permitData?.signature,
  })

  if (isSuccess) return <Success onDismiss={onDismiss} />

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize={20} fontWeight={500}>
          <Trans>Confirmation</Trans>
        </Text>
        <X onClick={onDismiss} />
      </Flex>

      <Condition position={position} selectedMetrics={selectedMetrics} conditionType={conditionType} />
      <ExpectedAmount position={position} selectedMetrics={selectedMetrics} conditionType={conditionType} />
      <MoreInfo deadline={deadline} protocolFee={protocolFee} />

      <Text fontStyle="italic" fontSize={14} color={theme.subText} my="1rem">
        <Trans>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </Trans>
      </Text>

      <ButtonPrimary
        disabled={permitState === PermitNftState.SIGNING || isCreating || !maxFeesPercentage}
        onClick={async () => {
          if (!maxFeesPercentage) return
          if (chainId !== position.chain.id) {
            changeNetwork(position.chain.id)
            return
          }

          if (permitState === PermitNftState.SIGNED && permitData) {
            // Create smart exit order
            await createSmartExitOrder({ maxFeesPercentage: [maxFeesPercentage, maxFeesPercentage] })
            return
          }
          if (permitState === PermitNftState.READY_TO_SIGN) {
            await signPermitNft()
          }
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
