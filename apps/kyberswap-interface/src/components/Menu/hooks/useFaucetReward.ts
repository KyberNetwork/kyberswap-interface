import { Fraction, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { REWARD_SERVICE_API } from 'constants/env'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/useTokens'
import { useNotify } from 'state/application/hooks'
import { isAddress } from 'utils/address'
import { filterTokens } from 'utils/filtering'
import { getNativeTokenLogo, getTokenLogoURL } from 'utils/tokenLogo'

type FaucetRewardData = {
  amount: bigint
  tokenAddress: string
  program: number
}

const getFaucetDisplayBalance = (balance: bigint, decimals = 18, significant = 6): string => {
  const amount = new Fraction(balance.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))
  if (amount.lessThan(new Fraction('1'))) {
    return amount.toSignificant(significant)
  }

  return amount.toFixed(0)
}

export const useFaucetReward = () => {
  const { chainId, account } = useActiveWeb3React()
  const notify = useNotify()
  const allTokens = useAllTokens()

  const [rewardData, setRewardData] = useState<FaucetRewardData>()

  const nativeLogo = getNativeTokenLogo(chainId)

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

  const tokenLogo = useMemo(() => {
    if (!token) return

    if (token.isNative) return nativeLogo

    return getTokenLogoURL(token.address, chainId)
  }, [chainId, token, nativeLogo])

  const tokenSymbol = useMemo(() => {
    if (token?.isNative && chainId) return WETH[chainId].name

    return token?.symbol
  }, [token, chainId])

  const rewardAmount = rewardData?.amount ? getFaucetDisplayBalance(rewardData?.amount, token?.decimals) : 0

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
        const amount = rewardData?.amount ? getFaucetDisplayBalance(rewardData?.amount, token?.decimals) : 0
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

  return {
    claimRewardCallBack,
    rewardAmount,
    rewardData,
    token,
    tokenLogo,
    tokenSymbol,
  }
}
