import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import TokenLogo from 'components/TokenLogo'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { TokenRewardRow } from 'pages/Earns/components/ClaimAllModal/TokenRewardRow'
import { RewardTab, RewardTabGroup } from 'pages/Earns/components/ClaimAllModal/styles'
import { ClaimInfoWrapper, ModalHeader, Wrapper, X } from 'pages/Earns/components/ClaimModal/styles'
import { ChainRewardInfo } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

type RewardTabType = 'ks' | 'bonus'

type KsRewardToken = {
  logo: string
  symbol: string
  amount: number
  value: number
}

type Props = {
  chainId: number
  chainName: string
  chainLogo: string
  // KEM farming reward for this single position
  ksTokens: Array<KsRewardToken>
  ksTotalValue: number
  onClaimKs: () => Promise<void>
  onCompound?: () => void
  compoundable?: boolean
  // Merkl bonus for the connected wallet on this chain (not scoped to the position)
  merklChainReward?: ChainRewardInfo
  onClaimMerkl?: (chainId: number) => Promise<string | undefined>
  merklSyncing?: boolean
  merklPendingTx?: boolean
  onClose: () => void
}

export default function PositionClaimModal({
  chainId,
  chainName,
  chainLogo,
  ksTokens,
  ksTotalValue,
  onClaimKs,
  onCompound,
  compoundable,
  merklChainReward,
  onClaimMerkl,
  merklSyncing,
  merklPendingTx,
  onClose,
}: Props) {
  const theme = useTheme()
  const { account, chainId: walletChainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const hasKs = ksTotalValue > 0
  const hasBonus = !!merklChainReward && merklChainReward.claimableUsdValue > 0

  const [internalTab, setInternalTab] = useState<RewardTabType>(hasKs ? 'ks' : 'bonus')
  // Force the single available tab when only one has rewards; otherwise honor the user's choice.
  const activeTab: RewardTabType = hasKs && hasBonus ? internalTab : hasKs ? 'ks' : 'bonus'
  const isBonus = activeTab === 'bonus'

  const [autoClaim, setAutoClaim] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  const currentTotalValue = isBonus ? merklChainReward?.claimableUsdValue || 0 : ksTotalValue

  const handleClaim = useCallback(async () => {
    if (walletChainId !== chainId || !account) {
      if (walletChainId !== chainId) changeNetwork(chainId)
      setAutoClaim(true)
      return
    }

    setIsClaiming(true)
    try {
      if (isBonus) {
        if (onClaimMerkl) await onClaimMerkl(chainId)
      } else {
        await onClaimKs()
      }
    } finally {
      setIsClaiming(false)
    }
  }, [account, walletChainId, chainId, changeNetwork, isBonus, onClaimMerkl, onClaimKs])

  useEffect(() => {
    if (autoClaim && walletChainId === chainId) {
      handleClaim()
      setAutoClaim(false)
    }
  }, [autoClaim, walletChainId, chainId, handleClaim])

  const claimDisabled = isBonus
    ? isClaiming || !!merklSyncing || !!merklPendingTx || !merklChainReward?.claimableUsdValue
    : isClaiming || !hasKs

  return (
    <Modal isOpen onDismiss={onClose} maxWidth={460}>
      <Wrapper>
        <ModalHeader>
          <span className="text-xl font-medium">{t`Claim Rewards`}</span>
          <X onClick={onClose} />
        </ModalHeader>

        {hasKs && hasBonus && (
          <RewardTabGroup>
            <RewardTab active={activeTab === 'ks'} onClick={() => setInternalTab('ks')}>
              {t`KS Rewards`} {formatDisplayNumber(ksTotalValue, { significantDigits: 4, style: 'currency' })}
            </RewardTab>
            <RewardTab active={activeTab === 'bonus'} onClick={() => setInternalTab('bonus')}>
              {t`Bonus`}
              <InfoHelper
                text={t`These bonus rewards are funded & distributed by a third party via Merkl. Claiming is per wallet on this chain, not per position.`}
                size={14}
              />
              {formatDisplayNumber(merklChainReward?.claimableUsdValue || 0, {
                significantDigits: 4,
                style: 'currency',
              })}
            </RewardTab>
          </RewardTabGroup>
        )}

        <ClaimInfoWrapper>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span>{t`Claimable Reward`}</span>
              <span className="text-lg">
                {formatDisplayNumber(currentTotalValue, { significantDigits: 4, style: 'currency' })}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {isBonus
                ? [...(merklChainReward?.tokens || [])]
                    .filter(token => token.claimableUsdValue > 0)
                    .sort((a, b) => b.claimableUsdValue - a.claimableUsdValue)
                    .map(token => (
                      <TokenRewardRow key={token.address} token={token} chainLogo={chainLogo} chainName={chainName} />
                    ))
                : [...ksTokens]
                    .sort((a, b) => b.value - a.value)
                    .map((token, index) => (
                      <div className="flex items-center justify-between" key={index}>
                        <div className="flex items-center gap-1">
                          <TokenLogo src={token.logo} size={16} alt={token.symbol} />
                          <TokenLogo
                            src={chainLogo}
                            size={10}
                            alt={chainName}
                            translateLeft
                            style={{ position: 'relative', top: 4, border: `1px solid ${theme.black}` }}
                          />
                          <span className="ml-1">{formatDisplayNumber(token.amount, { significantDigits: 4 })}</span>
                          <span>{token.symbol}</span>
                        </div>
                        <span className="text-subText">
                          {formatDisplayNumber(token.value, { significantDigits: 4, style: 'currency' })}
                        </span>
                      </div>
                    ))}
            </div>
          </div>

          {isBonus && (
            <div className="flex w-fit flex-wrap items-center gap-1 text-subText">
              <span>{t`You are currently claiming`}</span>
              <span className="text-text">
                {formatDisplayNumber(merklChainReward?.claimableUsdValue || 0, {
                  significantDigits: 4,
                  style: 'currency',
                })}
              </span>
              <span>{t`on`}</span>
              <span>{chainName}</span>
            </div>
          )}
        </ClaimInfoWrapper>

        {isBonus && merklSyncing && (
          <span className="-mt-1 text-xs text-warning">
            {t`Syncing your last claim with Merkl — please wait a moment.`}
          </span>
        )}

        <Row className="flex-row gap-4 max-xs:flex-col-reverse">
          {!isBonus && compoundable && onCompound ? (
            <ButtonOutlined className="text-primary" gap="4px" disabled={isClaiming} onClick={onCompound}>
              {t`Compound`}
            </ButtonOutlined>
          ) : (
            <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          )}
          <ButtonPrimary gap="4px" disabled={claimDisabled} onClick={handleClaim}>
            {(isClaiming || (isBonus && (merklSyncing || merklPendingTx))) && <Loader className="text-border" />}
            {isBonus
              ? isClaiming || merklPendingTx
                ? t`Claiming`
                : merklSyncing
                ? t`Syncing`
                : t`Claim Bonus`
              : isClaiming
              ? t`Claiming`
              : t`Claim only`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
