import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { NativeToken } from 'constants/networks/type'
import { useWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import {
  ClaimInfo,
  ClaimInfoRow,
  ClaimInfoWrapper,
  ModalHeader,
  Wrapper,
  X,
} from 'pages/Earns/components/ClaimModal/styles'
import { EarnDex } from 'pages/Earns/constants'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export enum ClaimType {
  FEES = 'fees',
  REWARDS = 'rewards',
}

export interface ClaimInfo {
  dex?: EarnDex
  nftId: string
  chainId: number
  tokens: Array<{
    logo: string
    symbol: string
    address?: string
    isNative?: boolean
    balance?: string | number
    value: number
    amount: number
  }>
  nativeToken?: NativeToken
  totalValue: number
}

const ClaimModal = ({
  claimType,
  claiming,
  claimInfo,
  onClaim,
  onClose,
}: {
  claimType: ClaimType
  claiming: boolean
  claimInfo: ClaimInfo
  onClaim: () => void
  onClose: () => void
}) => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { library, chainId } = useWeb3React()
  const { supportedChains } = useChainsConfig()
  const { changeNetwork } = useChangeNetwork()

  const [autoClaim, setAutoClaim] = useState(false)

  const handleClaim = useCallback(async () => {
    if (!library) return
    const accounts = await library.listAccounts()
    if (chainId !== claimInfo.chainId || !accounts.length) {
      if (chainId !== claimInfo.chainId) changeNetwork(claimInfo.chainId)
      setAutoClaim(true)
      return
    }

    onClaim()
  }, [library, chainId, claimInfo.chainId, onClaim, changeNetwork])

  useEffect(() => {
    if (autoClaim && chainId === claimInfo.chainId) {
      handleClaim()
      setAutoClaim(false)
    }
  }, [chainId, claimInfo.chainId, handleClaim, autoClaim])

  const chainLogo = supportedChains.find(chain => chain.chainId === claimInfo.chainId)?.icon || ''

  return (
    <Modal isOpen onDismiss={onClose}>
      <Wrapper>
        <ModalHeader>
          <Text fontSize={20} fontWeight={500}>
            {t`Claim ${claimType}`}
          </Text>
          <X onClick={onClose} />
        </ModalHeader>
        <ClaimInfoWrapper>
          <Text color={theme.subText}>{t`You are currently claiming`}</Text>
          <ClaimInfo>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
              <Text fontSize={14} color={theme.subText}>{t`Total Value`}</Text>
              <Text fontSize={18}>
                {formatDisplayNumber(claimInfo.totalValue, { style: 'currency', significantDigits: 4 })}
              </Text>
            </Flex>

            {claimInfo.tokens.map((token, index) => (
              <ClaimInfoRow
                key={index}
                dexImage={chainLogo}
                tokenImage={token.logo}
                tokenAmount={token.amount}
                tokenSymbol={token.symbol}
                tokenUsdValue={token.value}
              />
            ))}
          </ClaimInfo>
        </ClaimInfoWrapper>
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
          <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          <ButtonPrimary gap="4px" disabled={claiming} onClick={handleClaim}>
            {claiming && <Loader stroke={'#505050'} />}
            {claiming ? t`Claiming` : t`Claim`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}

export default ClaimModal
