import { Fraction, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Logo from 'components/Logo'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { REWARD_SERVICE_API } from 'constants/env'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNotify, useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { CloseIcon } from 'theme'
import { getNativeTokenLogo, getTokenLogoURL, isAddress, shortenAddress } from 'utils'
import { filterTokens } from 'utils/filtering'

const getFullDisplayBalance = (balance: bigint, decimals = 18, significant = 6): string => {
  const amount = new Fraction(balance.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))
  if (amount.lessThan(new Fraction('1'))) {
    return amount.toSignificant(significant)
  }

  return amount.toFixed(0)
}

function FaucetModal() {
  const { chainId, account } = useActiveWeb3React()
  const open = useModalOpen(ApplicationModal.FAUCET_POPUP)
  const toggle = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const [rewardData, setRewardData] = useState<{ amount: bigint; tokenAddress: string; program: number }>()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()
  const { trackingHandler } = useTracking()
  const allTokens = useAllTokens()
  const token = useMemo(() => {
    if (!account) return
    const nativeToken = NativeCurrencies[chainId]
    if (rewardData) {
      if (rewardData.tokenAddress === '0') return nativeToken
      if (isAddress(chainId, rewardData.tokenAddress))
        return filterTokens(chainId, Object.values(allTokens), rewardData.tokenAddress)[0]
    }
    return nativeToken
  }, [rewardData, chainId, account, allTokens])

  const nativeLogo = getNativeTokenLogo(chainId)
  const tokenLogo = useMemo(() => {
    if (!token) return
    if (token.isNative) return nativeLogo
    return getTokenLogoURL(token.address, chainId)
  }, [chainId, token, nativeLogo])
  const tokenSymbol = useMemo(() => {
    if (token?.isNative && chainId) return WETH[chainId].name
    return token?.symbol
  }, [token, chainId])
  const claimRewardCallBack = useCallback(async () => {
    if (!rewardData) return
    try {
      const rawResponse = await fetch(REWARD_SERVICE_API + '/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: account, program: rewardData.program }),
      })
      const content = await rawResponse.json()

      if (content) {
        const amount = rewardData?.amount ? getFullDisplayBalance(rewardData?.amount, token?.decimals) : 0
        notify({
          title: t`Request to Faucet - Submitted`,
          type: NotificationType.SUCCESS,
          summary: t`You will receive ${amount} ${tokenSymbol} soon!`,
        })
        setRewardData(rw => {
          if (rw) {
            rw.amount = 0n
          }
          return rw
        })
      }
    } catch (error) {
      console.log(error)
    }
  }, [account, notify, rewardData, token?.decimals, tokenSymbol])

  useEffect(() => {
    if (!account) return
    const getRewardAmount = async () => {
      try {
        const { data } = await fetch(`${REWARD_SERVICE_API}/faucets?wallet=${account}&chainId=${chainId}`).then(res =>
          res.json(),
        )
        if (data[0])
          setRewardData({
            amount: BigInt(data[0].amount),
            tokenAddress: data[0].token,
            program: data[0].programId,
          })
      } catch (err) {
        console.log(err)
      }
    }
    getRewardAmount()
  }, [chainId, account])
  const modalContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-[25px] px-6 py-[26px]">
        <RowBetween>
          <span className="text-xl font-medium text-text">
            <Trans>Faucet</Trans>
          </span>
          <CloseIcon onClick={toggle} />
        </RowBetween>

        <div className="overflow-hidden rounded-lg bg-buttonBlack p-3 [&>p]:m-0 [&>p]:mt-3 [&>p]:text-2xl [&>p]:font-medium [&>p]:leading-7 [&>p]:text-disableText">
          <span className="text-xs text-subText">
            <Trans>Your wallet address</Trans>
          </span>
          <p>{account && shortenAddress(chainId, account, 9)}</p>
        </div>
        <span className="text-base leading-6 text-text">
          <Trans>
            If your wallet is eligible, you will be able to request for some {tokenSymbol} tokens for free below. Each
            wallet can only request for the tokens once. You can claim:
          </Trans>
        </span>

        {token && (
          <div className="flex items-center gap-1.5 text-[28px] font-medium leading-[38px]">
            {tokenLogo && <Logo srcs={[tokenLogo]} alt={`${tokenSymbol ?? 'token'} logo`} className="w-7" />}{' '}
            {rewardData?.amount ? getFullDisplayBalance(rewardData?.amount, token?.decimals) : 0} {tokenSymbol}
          </div>
        )}

        {account ? (
          <ButtonPrimary
            disabled={!rewardData?.amount || rewardData?.amount === 0n}
            onClick={() => {
              claimRewardCallBack()
              trackingHandler(TRACKING_EVENT_TYPE.FAUCET_REQUEST_INITIATED)
              toggle()
            }}
            className="h-11 rounded-3xl"
          >
            <Trans>Request</Trans>
          </ButtonPrimary>
        ) : (
          <ButtonPrimary
            onClick={() => {
              toggleWalletModal()
            }}
            className="h-11 rounded-3xl"
          >
            <Trans>Connect</Trans>
          </ButtonPrimary>
        )}
      </div>
    )
  }, [
    chainId,
    account,
    claimRewardCallBack,
    trackingHandler,
    rewardData?.amount,
    toggle,
    toggleWalletModal,
    token,
    tokenLogo,
    tokenSymbol,
  ])

  return (
    <Modal isOpen={open} onDismiss={() => toggle()} maxHeight={90}>
      {modalContent}
    </Modal>
  )
}

export default FaucetModal
