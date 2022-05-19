import { Trans } from '@lingui/macro'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { ApplicationModal } from 'state/application/actions'
import { useAddPopup, useModalOpen, useToggleModal } from 'state/application/hooks'
import { ThemeContext } from 'styled-components'
import { ButtonPrimary } from 'components/Button'
import { getTokenLogoURL, isAddress, shortenAddress } from 'utils'
import styled from 'styled-components'
import { CloseIcon } from 'theme'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import Modal from 'components/Modal'
import { WETH, ETHER, Token } from '@dynamic-amm/sdk'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { BigNumber } from 'ethers'
import { useAllTokens } from 'hooks/Tokens'
import { filterTokens } from 'components/SearchModal/filtering'
import Logo from 'components/Logo'
import { logo } from 'components/CurrencyLogo'
const AddressWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 8px;
  padding: 12px;
  overflow: hidden;
  p {
    margin: 12px 0 0 0;
    font-size: 24px;
    line-height: 28px;
    font-weight: 500;
    color: ${({ theme }) => theme.disableText};
  }
`
function FaucetModal() {
  const { chainId, account } = useActiveWeb3React()
  const open = useModalOpen(ApplicationModal.FAUCET_POPUP)
  const toggle = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const theme = useContext(ThemeContext)
  const [rewardData, setRewardData] = useState<{ amount: BigNumber; tokenAddress: string; program: number }>()
  const addPopup = useAddPopup()
  const allTokens = useAllTokens()
  const token = useMemo(() => {
    if (!chainId || !account) return
    if (rewardData) {
      if (rewardData.tokenAddress === '0') return ETHER as Token
      if (isAddress(rewardData.tokenAddress)) return filterTokens(Object.values(allTokens), rewardData.tokenAddress)[0]
    }
    return ETHER as Token
  }, [rewardData, chainId, account])
  const tokenLogo = useMemo(() => {
    if (!chainId || !token) return
    if (token === ETHER) return logo[chainId]
    return getTokenLogoURL(token.address, chainId)
  }, [chainId, token])
  const claimRewardCallBack = async () => {
    if (!rewardData) return
    try {
      const rawResponse = await fetch('https://reward.dev.kyberengineering.io/api/v1/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: account, program: rewardData.program }),
      })
      const content = await rawResponse.json()
      if (content) {
        addPopup({
          simple: {
            title: `Request ${token?.symbol} - Success`,
            success: true,
            summary: `Received ${rewardData?.amount ? getFullDisplayBalance(rewardData?.amount, token?.decimals) : 0} ${
              token?.symbol
            }`,
          },
        })
      }
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    if (!chainId || !account) return
    const getRewardAmount = async () => {
      try {
        const { data } = await fetch(
          `https://reward.dev.kyberengineering.io/api/v1/faucets?wallet=${account}&chainId=${chainId}`,
        ).then(res => res.json())
        if (data[0])
          setRewardData({
            amount: BigNumber.from(data[0].Amount),
            tokenAddress: data[0].Token,
            program: data[0].ProgramId,
          })
      } catch (err) {
        console.log(err)
      }
    }
    getRewardAmount()
  }, [chainId, account])
  const modalContent = () => (
    <Flex flexDirection={'column'} padding="26px 24px" style={{ gap: '25px' }}>
      <RowBetween>
        <Text fontSize={20} fontWeight={500} color={theme.text}>
          <Trans>Faucet</Trans>
        </Text>
        <CloseIcon onClick={toggle} />
      </RowBetween>

      <AddressWrapper>
        <Text color={theme.subText} fontSize={12}>
          <Trans>Your wallet address</Trans>
        </Text>
        <p>{account && shortenAddress(account, 9)}</p>
      </AddressWrapper>
      <Text fontSize={16} lineHeight="24px" color={theme.text}>
        <Trans>
          If your wallet is eligible, you will be able to request for some {token?.symbol} tokens for free below. Each
          wallet can only request for the tokens once. You can claim:
        </Trans>
      </Text>
      <Text fontSize={32} lineHeight="38px" fontWeight={500}>
        {token && (
          <>
            {tokenLogo && (
              <Logo
                srcs={[tokenLogo]}
                alt={`${token?.symbol ?? 'token'} logo`}
                style={{ width: '28px', paddingRight: '8px' }}
              />
            )}{' '}
            {rewardData?.amount ? getFullDisplayBalance(rewardData?.amount, token?.decimals) : 0} {token?.symbol}
          </>
        )}
      </Text>

      <ButtonPrimary
        disabled={!rewardData?.amount || rewardData?.amount.eq(0)}
        onClick={() => {
          claimRewardCallBack()
          toggle()
        }}
        style={{ borderRadius: '24px', height: '44px' }}
      >
        <Trans>Request</Trans>
      </ButtonPrimary>
    </Flex>
  )

  return (
    <Modal
      isOpen={open}
      onDismiss={() => {
        toggle()
      }}
      maxHeight={90}
    >
      {modalContent()}
    </Modal>
  )
}

export default FaucetModal
