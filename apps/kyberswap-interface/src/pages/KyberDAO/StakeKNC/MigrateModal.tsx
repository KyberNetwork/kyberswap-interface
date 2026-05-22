import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { parseUnits } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { ArrowDown, X } from 'react-feather'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import Row, { AutoRow, RowBetween } from 'components/Row'
import useParsedAmount from 'components/SwapForm/hooks/useParsedAmount'
import { useActiveWeb3React } from 'hooks'
import { useKyberDAOInfo, useKyberDaoStakeActions } from 'hooks/kyberdao'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import CurrencyInputForStake from './CurrencyInputForStake'
import { useSwitchToEthereum } from './SwitchToEthereumModal'

export default function MigrateModal({
  setPendingText,
  setShowConfirm,
  setAttemptingTxn,
  setTransactionError,
  setTxHash,
}: {
  setPendingText: React.Dispatch<React.SetStateAction<string>>
  setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>
  setAttemptingTxn: React.Dispatch<React.SetStateAction<boolean>>
  setTransactionError: React.Dispatch<React.SetStateAction<string | undefined>>
  setTxHash: React.Dispatch<React.SetStateAction<string | undefined>>
}) {
  const kyberDAOInfo = useKyberDAOInfo()
  const theme = useTheme()
  const { chainId, account } = useActiveWeb3React()
  const modalOpen = useModalOpen(ApplicationModal.MIGRATE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.MIGRATE_KNC)
  const toggleWalletModal = useWalletModalToggle()

  const { migrate } = useKyberDaoStakeActions()
  const [value, setValue] = useState('1')
  const [error, setError] = useState('')
  const parsedAmount = useParsedAmount(
    new Token(chainId === ChainId.GÖRLI ? ChainId.GÖRLI : ChainId.MAINNET, kyberDAOInfo?.KNCLAddress || '', 18, 'KNCL'),
    value,
  )

  const [approval, approveCallback] = useApproveCallback(parsedAmount, kyberDAOInfo?.KNCAddress)

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
    } else if (!oldKNCBalance.value.gte(parseUnits(value, 18))) {
      setError(t`Insufficient KNCL balance!`)
      return
    } else {
      setError('')
    }
  }, [value, oldKNCBalance?.value])
  const { switchToEthereum } = useSwitchToEthereum()

  const handleMigrate = () => {
    setError('')
    switchToEthereum(t`Migrate`).then(() => {
      try {
        setPendingText(t`Migrating ${value} KNCL to KNC`)
        setShowConfirm(true)
        setAttemptingTxn(true)
        toggleModal()
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
    })
  }

  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={664} maxWidth={420}>
      <div className="p-6">
        <AutoColumn gap="20px">
          <RowBetween>
            <span className="text-xl text-text">
              <Trans>KNC Migration</Trans>
            </span>
            <div role="button" onClick={toggleModal} className="flex cursor-pointer">
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </div>
          </RowBetween>
          <span className="text-xs leading-4 text-subText">
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
          <Row gap="12px">
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
        </AutoColumn>
      </div>
    </Modal>
  )
}
