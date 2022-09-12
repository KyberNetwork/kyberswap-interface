import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit2 } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import HoverDropdown from 'components/HoverDropdown'
import Deposit from 'components/Icons/Deposit'
import Harvest from 'components/Icons/Harvest'
import Withdraw from 'components/Icons/Withdraw'
import InfoHelper from 'components/InfoHelper'
import ShareModal from 'components/ShareModal'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useTokens } from 'hooks/Tokens'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal, useWalletModalToggle } from 'state/application/hooks'
import { useRewardTokenPrices } from 'state/farms/hooks'
import { useFailedNFTs, useFarmAction } from 'state/farms/promm/hooks'
import { ProMMFarm } from 'state/farms/promm/types'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { formatDollarAmount } from 'utils/numbers'

import { ClickableText, ProMMFarmTableHeader } from '../styleds'
import Row from './Row'

const BtnPrimary = styled(ButtonPrimary)`
  font-size: 14px;
  :disabled {
    background: ${({ theme }) => theme.buttonGray};
    cursor: not-allowed;
    opacity: 0.4;
  }
`

const FarmContent = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  overflow: hidden;
`

const FarmRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.4)};
  padding: 1rem;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  `}
`

const BtnLight = styled(ButtonLight)`
  padding: 8px 12px;
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 8px;
  `};
`

function ProMMFarmGroup({
  address,
  onOpenModal,
  farms,
}: {
  address: string
  onOpenModal: (
    modalType: 'forcedWithdraw' | 'harvest' | 'deposit' | 'withdraw' | 'stake' | 'unstake',
    pid?: number,
  ) => void
  farms: ProMMFarm[]
}) {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)')
  const above1000 = useMedia('(min-width: 1000px)')
  const networkRoute = chainId ? NETWORKS_INFO[chainId].route : undefined

  const [userPoolFarmInfo, setUserPoolFarmInfo] = useState<{
    [pid: number]: {
      usdValue: number
      token0Amount: CurrencyAmount<Token>
      token1Amount: CurrencyAmount<Token>
    }
  }>({})

  const [sharedPoolAddress, setSharedPoolAddress] = useState('')
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const shareUrl = sharedPoolAddress
    ? window.location.origin + '/farms?search=' + sharedPoolAddress + '&tab=elastic&networkId=' + networkRoute
    : undefined

  const rewardAddresses = useMemo(() => {
    const rws = farms.reduce((acc, cur) => [...acc, ...cur.rewardTokens], [] as string[])
    return [...new Set(rws)]
  }, [farms])

  const rwTokenMap = useTokens(rewardAddresses)

  const rwTokens = useMemo(() => Object.values(rwTokenMap), [rwTokenMap])
  const prices = useRewardTokenPrices(rwTokens, VERSION.ELASTIC)

  const priceMap: { [key: string]: number } = useMemo(
    () =>
      prices?.reduce(
        (acc, cur, index) => ({
          ...acc,
          [rwTokens[index]?.isToken ? rwTokens[index].address : ZERO_ADDRESS]: cur,
        }),
        {},
      ),
    [prices, rwTokens],
  )

  const totalUserReward: { totalUsdValue: number; amounts: CurrencyAmount<Token>[] } = useMemo(() => {
    const temp: { [address: string]: BigNumber } = {}
    farms.forEach(farm => {
      const tks = farm.rewardTokens

      farm.userDepositedNFTs.forEach(pos => {
        pos.rewardPendings.forEach((amount, index) => {
          const tkAddress = tks[index]
          if (temp[tkAddress]) temp[tkAddress] = temp[tkAddress].add(amount)
          else temp[tkAddress] = amount
        })
      })
    })

    let usd = 0
    const amounts: CurrencyAmount<Token>[] = []

    Object.keys(temp).forEach((key: string) => {
      const token = rwTokenMap[key]
      const price = priceMap[key]

      if (token) {
        const amount = CurrencyAmount.fromRawAmount(token, temp[key].toString())
        usd += price * parseFloat(amount.toExact())
        if (amount.greaterThan(0)) amounts.push(amount)
      }
    })

    return {
      totalUsdValue: usd,
      amounts,
    }
  }, [farms, rwTokenMap, priceMap])

  const depositedUsd = Object.values(userPoolFarmInfo).reduce((acc, cur) => acc + cur.usdValue, 0)

  const userDepositedTokenAmounts = Object.values(userPoolFarmInfo).reduce<{
    [address: string]: CurrencyAmount<Token>
  }>((result, info) => {
    const address0 = info.token0Amount.currency.address
    const address1 = info.token1Amount.currency.address

    if (!result[address0]) result[address0] = info.token0Amount
    else result[address0] = result[address0].add(info.token0Amount)

    if (!result[address1]) result[address1] = info.token1Amount
    else result[address1] = result[address1].add(info.token1Amount)

    return result
  }, {})

  const failedNFTs = useFailedNFTs()
  const userNFTs = farms.map(farm => farm.userDepositedNFTs.map(item => item.tokenId.toString())).flat()
  const hasAffectedByFarmIssue = userNFTs.some(id => failedNFTs.includes(id))

  const toggleWalletModal = useWalletModalToggle()
  const posManager = useProAmmNFTPositionManagerContract()

  const res = useSingleCallResult(posManager, 'isApprovedForAll', [account || ZERO_ADDRESS, address])
  const isApprovedForAll = res?.result?.[0]

  const { approve } = useFarmAction(address)
  const [approvalTx, setApprovalTx] = useState('')

  const isApprovalTxPending = useIsTransactionPending(approvalTx)

  const handleApprove = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
    }
  }

  const aggregateDepositedInfo = useCallback(
    ({
      poolAddress,
      usdValue,
      token0Amount,
      token1Amount,
    }: {
      poolAddress: string | number
      usdValue: number
      token0Amount: CurrencyAmount<Token>
      token1Amount: CurrencyAmount<Token>
    }) => {
      setUserPoolFarmInfo(prev => ({
        ...prev,
        [poolAddress]: {
          usdValue,
          token0Amount,
          token1Amount,
        },
      }))
    },
    [],
  )

  const qs = useParsedQueryString()
  const tab = qs.type || 'active'

  useEffect(() => {
    if (sharedPoolAddress) {
      openShareModal()
    }
  }, [openShareModal, sharedPoolAddress])

  useEffect(() => {
    setSharedPoolAddress(addr => {
      if (!isShareModalOpen) {
        return ''
      }

      return addr
    })
  }, [isShareModalOpen, setSharedPoolAddress])

  if (!farms) return null

  const canHarvest = farms.some(farm => farm.userDepositedNFTs.some(pos => !!pos.rewardPendings.length))
  const canWithdraw = farms.some(farms => farms.userDepositedNFTs.length)

  const renderDepositButton = () => {
    if (!isApprovedForAll || tab === 'ended') {
      return (
        <BtnLight disabled>
          <Deposit width={20} height={20} />
          {above768 && (
            <Text fontSize="14px" marginLeft="4px">
              <Trans>Deposit</Trans>
            </Text>
          )}
        </BtnLight>
      )
    }

    return (
      <MouseoverTooltip text={t`Deposit your liquidity (the NFT tokens that represent your liquidity position)`}>
        <BtnLight onClick={() => onOpenModal('deposit')} disabled={tab === 'ended'}>
          <Deposit width={20} height={20} />
          {above768 && (
            <Text fontSize="14px" marginLeft="4px">
              <Trans>Deposit</Trans>
            </Text>
          )}
        </BtnLight>
      </MouseoverTooltip>
    )
  }

  const renderWithdrawButton = () => {
    if (!canWithdraw || !isApprovedForAll) {
      return (
        <ButtonOutlined padding={above768 ? '8px 12px' : '8px'} disabled>
          <Withdraw width={20} height={20} />
          {above768 && (
            <Text fontSize="14px" marginLeft="4px">
              <Trans>Withdraw</Trans>
            </Text>
          )}
        </ButtonOutlined>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={t`Withdraw your liquidity (the NFT tokens that represent your liquidity position)`}
      >
        <ButtonOutlined padding={above768 ? '8px 12px' : '8px'} onClick={() => onOpenModal('withdraw')}>
          <Withdraw width={20} height={20} />
          {above768 && (
            <Text fontSize="14px" marginLeft="4px">
              <Trans>Withdraw</Trans>
            </Text>
          )}
        </ButtonOutlined>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const renderForceWithdrawButton = () => {
    if (hasAffectedByFarmIssue && above768) {
      return (
        <BtnPrimary
          style={{ color: theme.red, border: `1px solid ${theme.red}`, background: theme.red + '33' }}
          width="fit-content"
          padding={above768 ? '8px 12px' : '8px'}
          onClick={() => onOpenModal('forcedWithdraw')}
        >
          <Withdraw width={20} height={20} />
          <Text fontSize="14px" marginLeft="4px">
            <Trans>Force Withdraw</Trans>
          </Text>
        </BtnPrimary>
      )
    }

    return null
  }

  const renderTopButtons = () => {
    if (!account) {
      return (
        <BtnLight onClick={toggleWalletModal}>
          <Trans>Connect Wallet</Trans>
        </BtnLight>
      )
    }

    if (!isApprovedForAll && res?.loading) {
      return <Dots />
    }

    return (
      <Flex sx={{ gap: '12px' }} alignItems="center">
        {isApprovedForAll ? null : (
          <BtnLight onClick={handleApprove} disabled={isApprovalTxPending || tab === 'ended'}>
            <Edit2 size={16} />
            <Text fontSize="14px" marginLeft="4px">
              {approvalTx && isApprovalTxPending ? (
                <Dots>
                  <Trans>Approving</Trans>
                </Dots>
              ) : (
                <Trans>Approve</Trans>
              )}
            </Text>
          </BtnLight>
        )}
        {(!!isApprovedForAll || above768) && (
          <>
            {renderDepositButton()}
            {renderWithdrawButton()}
          </>
        )}
        {renderForceWithdrawButton()}
      </Flex>
    )
  }

  return (
    <FarmContent>
      {above1000 && (
        <ProMMFarmTableHeader>
          <Flex grid-area="token_pairs" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Pool</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="liq" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Staked TVL</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>AVG APR</Trans>
            </ClickableText>
            <InfoHelper
              text={t`Average estimated return based on yearly fees of the pool and if it's still active, plus bonus rewards of the pool`}
            />
          </Flex>

          <Flex grid-area="end" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Ending In</Trans>
            </ClickableText>
            <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
          </Flex>

          <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Deposit</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Rewards</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="action" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Actions</Trans>
            </ClickableText>
          </Flex>
        </ProMMFarmTableHeader>
      )}

      <FarmRow>
        {hasAffectedByFarmIssue && !above768 && (
          <BtnPrimary
            style={{ color: theme.red, border: `1px solid ${theme.red}`, background: theme.red + '33' }}
            padding={'12px'}
            onClick={() => onOpenModal('forcedWithdraw')}
          >
            <Withdraw width={20} height={20} />
            <Text fontSize="14px" marginLeft="4px">
              <Trans>Force Withdraw</Trans>
            </Text>
          </BtnPrimary>
        )}

        <Flex
          sx={{ gap: '20px' }}
          alignItems="center"
          justifyContent={above768 ? 'flex-start' : 'space-between'}
          width={above768 ? undefined : '100%'}
        >
          <Flex flexDirection="column">
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Deposited Liquidity</Trans>
              <InfoHelper
                text={t`Total value of the liquidity positions you've deposited. NFT tokens represent your liquidity positions`}
              ></InfoHelper>
            </Text>

            <HoverDropdown
              style={{ padding: '8px 0' }}
              content={formatDollarAmount(depositedUsd)}
              dropdownContent={
                Object.values(userDepositedTokenAmounts).some(amount => amount.greaterThan(0)) ? (
                  <AutoColumn gap="sm">
                    {Object.values(userDepositedTokenAmounts).map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px">
                              {amount.toSignificant(8)}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>

          {renderTopButtons()}
        </Flex>

        {!above768 && <Divider style={{ width: '100%' }} />}

        <Flex
          alignItems="center"
          sx={{ gap: '24px' }}
          justifyContent={above768 ? 'flex-start' : 'space-between'}
          width={above768 ? undefined : '100%'}
        >
          <Flex flexDirection="column">
            <Text fontSize="12px" color={theme.subText}>
              <Trans>My Total Rewards</Trans>
            </Text>

            <HoverDropdown
              style={{ padding: '8px 0' }}
              content={formatDollarAmount(totalUserReward.totalUsdValue)}
              dropdownContent={
                totalUserReward.amounts.length ? (
                  <AutoColumn gap="sm">
                    {totalUserReward.amounts.map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px">
                              {amount.toSignificant(8)}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>

          <BtnPrimary
            padding="10px 12px"
            width="fit-content"
            onClick={() => onOpenModal('harvest')}
            disabled={!canHarvest}
          >
            <Harvest />
            <Text marginLeft="4px">
              <Trans>Harvest All</Trans>
            </Text>
          </BtnPrimary>
        </Flex>
      </FarmRow>
      <Divider />

      {farms.map((farm, index) => {
        return (
          <Row
            isUserAffectedByFarmIssue={hasAffectedByFarmIssue}
            isApprovedForAll={isApprovedForAll}
            farm={farm}
            key={farm.poolAddress + '_' + index}
            onOpenModal={onOpenModal}
            onUpdateDepositedInfo={aggregateDepositedInfo}
            fairlaunchAddress={address}
            onHarvest={() => {
              onOpenModal('harvest', farm.pid)
            }}
            setSharedPoolAddress={setSharedPoolAddress}
          />
        )
      })}

      <ShareModal title={t`Share this farm with your friends!`} url={shareUrl} />
    </FarmContent>
  )
}

export default ProMMFarmGroup
