import { Trans } from '@lingui/macro'
import { X } from 'react-feather'
import { useGetSmartExitConfigQuery } from 'services/smartExit'

import { ButtonPrimary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { PermitNftState, usePermitNft } from 'hooks/usePermitNft'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Condition from 'pages/Earns/components/SmartExit/Confirmation/Condition'
import MoreInfo from 'pages/Earns/components/SmartExit/Confirmation/MoreInfo'
import Success from 'pages/Earns/components/SmartExit/Confirmation/Success'
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
  const { chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconArrowLeft onClick={onDismiss} />
          <span className="text-xl font-medium">
            <Trans>Confirmation</Trans>
          </span>
        </div>
        <X onClick={onDismiss} />
      </div>

      <Condition
        position={position}
        selectedMetrics={selectedMetrics}
        conditionType={conditionType}
        revertPrice={revertPrice}
      />
      <MoreInfo deadline={deadline} protocolFee={protocolFee} maxGas={maxGas} />

      <p className="my-4 text-sm italic text-subText">
        <Trans>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </Trans>
      </p>

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
