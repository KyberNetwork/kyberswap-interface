import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useNftApprovalAll } from 'hooks/useNftApprovalAll'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import Condition from 'pages/Earns/components/SmartExit/Confirmation/Condition'
import MoreInfo from 'pages/Earns/components/SmartExit/Confirmation/MoreInfo'
import Success from 'pages/Earns/components/SmartExit/Confirmation/Success'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { SMART_EXIT_ADDRESS } from 'pages/Earns/constants'
import { ConditionType, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { submitTransaction } from 'pages/Earns/utils'
import { useKyberSwapConfig } from 'state/application/hooks'

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
  const { chainId, account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const { rpc } = useKyberSwapConfig(position.chain.id)

  const { isApproved, approveAll, approvePendingTx } = useNftApprovalAll({
    spender: SMART_EXIT_ADDRESS,
    userAddress: account || '',
    rpcUrl: rpc,
    nftManagerContract: position.id.split('-')[0],
    onSubmitTx: async (txData: { from: string; to: string; data: string; value: string; gasLimit: string }) => {
      const res = await submitTransaction({ library, txData })
      const { txHash, error } = res
      if (!txHash || error) throw new Error(error?.message || 'Transaction failed')
      return txHash
    },
  })
  const [approveClicked, setApproveClicked] = useState(false)

  const { createSmartExitOrder, isCreating, isSuccess } = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
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
      <MoreInfo deadline={deadline} protocolFee={protocolFee} />

      <Text fontStyle="italic" fontSize={14} color={theme.subText} my="1rem">
        <Trans>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </Trans>
      </Text>

      <ButtonPrimary
        disabled={Boolean(approveClicked || approvePendingTx || isCreating || !maxFeesPercentage)}
        onClick={async () => {
          if (!maxFeesPercentage || approveClicked || approvePendingTx) return
          if (chainId !== position.chain.id) {
            changeNetwork(position.chain.id)
            return
          }

          if (isApproved) {
            // Create smart exit order
            await createSmartExitOrder({ maxFeesPercentage: [maxFeesPercentage, maxFeesPercentage] })
            return
          }
          setApproveClicked(true)
          approveAll().finally(() => setApproveClicked(false))
        }}
      >
        {chainId !== position.chain.id ? (
          <Trans>Switch Network</Trans>
        ) : isCreating ? (
          <Trans>Creating Order...</Trans>
        ) : isApproved ? (
          <Trans>Confirm Smart Exit</Trans>
        ) : approveClicked || approvePendingTx ? (
          <Trans>Approving...</Trans>
        ) : (
          <Trans>Approve NFT</Trans>
        )}
      </ButtonPrimary>
    </>
  )
}
