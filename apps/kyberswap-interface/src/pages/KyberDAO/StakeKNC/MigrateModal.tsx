import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { Stack } from 'components/Stack'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { useActiveWeb3React } from 'hooks'
import { useKyberDAOInfo, useKyberDaoStakeActions } from 'hooks/kyberdao'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTokenBalance from 'hooks/useTokenBalance'
import CurrencyInputForStake from 'pages/KyberDAO/StakeKNC/CurrencyInputForStake'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import { KyberDAOModalCloseButton } from 'pages/KyberDAO/common'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen, useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { parseUnits } from 'utils/viem'

type MigrateModalProps = {
  setPendingText: Dispatch<SetStateAction<string>>
  setShowConfirm: Dispatch<SetStateAction<boolean>>
  setAttemptingTxn: Dispatch<SetStateAction<boolean>>
  setTransactionError: Dispatch<SetStateAction<string | undefined>>
  setTxHash: Dispatch<SetStateAction<string | undefined>>
}

const MigrateModalContent = ({
  setPendingText,
  setShowConfirm,
  setAttemptingTxn,
  setTransactionError,
  setTxHash,
  onDismiss,
}: MigrateModalProps & { onDismiss: () => void }) => {
  const kyberDAOInfo = useKyberDAOInfo()
  const { chainId, account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const { migrate } = useKyberDaoStakeActions()
  const [value, setValue] = useState('1')
  const [error, setError] = useState('')
  const knclToken = useMemo(
    () =>
      new Token(
        chainId === ChainId.GÖRLI ? ChainId.GÖRLI : ChainId.MAINNET,
        kyberDAOInfo?.KNCLAddress || '',
        18,
        'KNCL',
      ),
    [chainId, kyberDAOInfo?.KNCLAddress],
  )
  const parsedAmount = useParsedAmount(knclToken, value)

  const [approval, approveCallback] = useApproveCallback({
    amount: parsedAmount,
    spender: kyberDAOInfo?.KNCAddress,
  })

  const oldKNCBalance = useTokenBalance(kyberDAOInfo?.KNCLAddress || '')
  useEffect(() => {
    try {
      parseUnits(value, 18)
    } catch {
      setError(t`Invalid amount`)
      return
    }
    if (!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
      setError(t`Invalid amount`)
    } else if (oldKNCBalance.value < parseUnits(value, 18)) {
      setError(t`Insufficient KNCL balance!`)
      return
    } else {
      setError('')
    }
  }, [value, oldKNCBalance?.value])
  const { switchToEthereum } = useSwitchToEthereum()

  const handleMigrate = async () => {
    try {
      await switchToEthereum(t`Migrate`)
    } catch {
      return
    }

    setError('')
    try {
      setPendingText(t`Migrating ${value} KNCL to KNC`)
      setShowConfirm(true)
      setAttemptingTxn(true)
      onDismiss()
      migrate(parseUnits(value, 18), value)
        .then(tx => {
          setAttemptingTxn(false)
          setTxHash(tx)
        })
        .catch(error => {
          setTransactionError(error?.message)
          setAttemptingTxn(false)
        })
    } catch (error) {
      setError(error)
    }
  }

  return (
    <Modal isOpen onDismiss={onDismiss} minHeight={false} maxHeight={664} maxWidth={420}>
      <div className="p-6">
        <Stack className="gap-4">
          <RowBetween>
            <span className="text-xl text-text">
              <Trans>KNC Migration</Trans>
            </span>
            <KyberDAOModalCloseButton onClick={onDismiss} />
          </RowBetween>
          <span className="text-xs text-subText">
            <Trans>
              Click Migrate to start the migration process from KNC Legacy to the new KNC. You will receive the new KNC
              tokens in your wallet once the transaction has been confirmed. Conversion rate is 1:1. Read about the KNC{' '}
              migration{' '}
              <ExternalLink href="https://blog.kyber.network/knc-token-migration-guide-fda08bfe62c2">
                {' '}
                here ↗
              </ExternalLink>
            </Trans>
          </span>
          <CurrencyInputForStake
            value={value}
            setValue={setValue}
            tokenAddress={kyberDAOInfo?.KNCLAddress || ''}
            tokenName="KNCL"
          />
          <RowBetween>
            <span className="text-xs text-subText">1KNCL = 1KNC</span>
            <AutoRow className="size-11 rounded-full bg-buttonBlack p-2.5">
              <ArrowDown />
            </AutoRow>
          </RowBetween>
          <CurrencyInputForStake
            value={value}
            setValue={setValue}
            tokenAddress={kyberDAOInfo?.KNCAddress || ''}
            tokenName="KNC"
            disabled
          />
          <Row className="gap-4">
            {account ? (
              <>
                {(approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) && !error && (
                  <ButtonPrimary onClick={() => approveCallback()} disabled={approval === ApprovalState.PENDING}>
                    {approval === ApprovalState.PENDING ? 'Approving...' : 'Approve'}
                  </ButtonPrimary>
                )}
                <ButtonPrimary disabled={approval !== ApprovalState.APPROVED || !!error} onClick={handleMigrate}>
                  <span className="text-sm">{error || <Trans>Migrate</Trans>}</span>
                </ButtonPrimary>
              </>
            ) : (
              <ButtonLight onClick={toggleWalletModal}>
                <Trans>Connect</Trans>
              </ButtonLight>
            )}
          </Row>
        </Stack>
      </div>
    </Modal>
  )
}

export default function MigrateModal(props: MigrateModalProps) {
  const modalOpen = useModalOpen(ApplicationModal.MIGRATE_KNC)
  const closeModal = useCloseModal(ApplicationModal.MIGRATE_KNC)

  return modalOpen ? <MigrateModalContent {...props} onDismiss={closeModal} /> : null
}
