import { CurrencyAmount, Percent } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { ElasticPoolKN, NormalizedFarm } from 'services/knprotocol'

import ExampleImage from 'assets/images/elastic_farm_v2_example.png'
import ExampleImageMobile from 'assets/images/elastic_farm_v2_example_mobile.png'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { NotificationType } from 'components/Announcement/type'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import CheckBox from 'components/CheckBox'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Modal from 'components/Modal'
import Tabs from 'components/Tabs'
import { MouseoverTooltip } from 'components/Tooltip'
import FarmV2ABI from 'constants/abis/v2/farmv2.json'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerReadingContract, useSigningContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { convertTickToPrice } from 'pages/Farm/ElasticFarmv2/utils'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useFarmAction } from 'state/farms/elastic/hooks'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ButtonText, ExternalLink, MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { calculateGasMargin } from 'utils'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

import { ChainLogo, PositionTable, PositionTableHeader, PositionTableRow, Tag } from '../styled'

export default function StakeStaticFarmModal({ farm, onDismiss }: { farm: NormalizedFarm; onDismiss: () => void }) {
  const theme = useTheme()
  const addTransactionWithType = useTransactionAdder()
  const notify = useNotify()
  const { chainId, account } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const [activeRange, setActiveRange] = useState(farm.ranges.filter(item => !item.isRemoved)[0])

  const posManager = useProAmmNFTPositionManagerReadingContract()
  const farmChainId = farm.chain.chainId
  const farmAddress = farm.farmAddress

  const contract = useSigningContract(farmAddress, FarmV2ABI)

  const [checkingAllowance, setCheckingAllowance] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [staking, setStaking] = useState(false)

  const availablePositions = useMemo(
    () =>
      farm.positions?.filter(
        item =>
          item.liquidity !== '0' &&
          +item.tickLower <= activeRange.tickLower &&
          +item.tickUpper >= activeRange.tickUpper,
      ),
    [farm, activeRange.tickUpper, activeRange.tickLower],
  )

  const [selectedNfts, setSelectedNfts] = useState<string[]>([])
  const checkAllRef = useRef<any>()

  useEffect(() => {
    setSelectedNfts(availablePositions.map(item => item.id))
  }, [availablePositions])

  useEffect(() => {
    if (farmChainId === chainId && posManager && account) {
      setCheckingAllowance(true)
      posManager
        .isApprovedForAll(account, farmAddress)
        .then((res: boolean) => {
          setIsApproved(res)
        })
        .finally(() => setCheckingAllowance(false))
    }
  }, [chainId, farmChainId, posManager, farmAddress, account])

  const { approve } = useFarmAction(farmAddress)
  const [approvalTx, setApprovalTx] = useState('')
  const isApprovalTxPending = useIsTransactionPending(approvalTx)
  const [approving, setApproving] = useState(false) // waiting response from wallet

  useEffect(() => {
    if (!checkAllRef.current) return
    if (selectedNfts.length === 0) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    } else if (selectedNfts.length > 0 && selectedNfts.length < availablePositions.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    } else {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    }
  }, [selectedNfts.length, availablePositions])

  const addliquidityElasticPool = '/TODO'

  // `/${networkInfo.route}${APP_PATHS.ELASTIC_CREATE_POOL}/${
  //   farm.token0.isNative ? farm.token0.symbol : farm.token0.address
  // }/${farm.token1.isNative ? farm.token1.symbol : farm.token1.address}/${farm.pool.fee}?farmRange=${
  //   activeRange.index
  // }&fId=${farm.fId}`

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  return (
    <Modal isOpen onDismiss={onDismiss} maxWidth="800px" width="100vw">
      <Flex width="100%" padding="20px" flexDirection="column" sx={{ gap: '20px' }} backgroundColor={theme.background}>
        <Flex justifyContent="space-between" alignItems="center" width="100%">
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            <Box sx={{ position: 'relative' }}>
              <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} size={24} />
              <ChainLogo src={farm.chain.icon} size={12} />
            </Box>

            <Text fontSize="20px" fontWeight="500">
              Stake your liquidity
            </Text>
          </Flex>

          <ButtonText onClick={onDismiss}>
            <X color={theme.text} />
          </ButtonText>
        </Flex>

        <Text color={theme.subText} fontSize="12px" lineHeight="16px">
          <Trans>
            Stake your liquidity positions (NFT tokens) into the farm to start earning rewards. Only positions that
            cover the pre-configured farming price range will earn maximum rewards. Read more{' '}
            <ExternalLink href="/TODO">here ↗</ExternalLink>
          </Trans>
        </Text>

        <PositionTable>
          <Tabs
            activeKey={activeRange.index}
            onChange={key => {
              const range = farm.ranges.find(item => +item.index === +key)
              if (range) setActiveRange(range)
            }}
            items={farm.ranges
              .filter(range => !range.isRemoved)
              .map(range => {
                const priceLower = convertTickToPrice(
                  farm.token0,
                  farm.token1,
                  range.tickLower,
                  +(farm.pool as ElasticPoolKN).feeTier,
                )
                const priceUpper = convertTickToPrice(
                  farm.token0,
                  farm.token1,
                  range.tickUpper,
                  +(farm.pool as ElasticPoolKN).feeTier,
                )

                return {
                  key: range.index,
                  label: (
                    <Flex sx={{ gap: '2px' }} alignItems="center">
                      {priceLower}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" display="block">
                        <path
                          d="M11.3405 8.66669L11.3405 9.86002C11.3405 10.16 11.7005 10.3067 11.9071 10.0934L13.7605 8.23335C13.8871 8.10002 13.8871 7.89335 13.7605 7.76002L11.9071 5.90669C11.7005 5.69335 11.3405 5.84002 11.3405 6.14002L11.3405 7.33335L4.66047 7.33335L4.66047 6.14002C4.66047 5.84002 4.30047 5.69335 4.0938 5.90669L2.24047 7.76669C2.1138 7.90002 2.1138 8.10669 2.24047 8.24002L4.0938 10.1C4.30047 10.3134 4.66047 10.16 4.66047 9.86669L4.66047 8.66669L11.3405 8.66669Z"
                          fill="currentcolor"
                        />
                      </svg>
                      {priceUpper}
                    </Flex>
                  ),
                  children: !availablePositions.length ? (
                    <div style={{ overflowY: 'scroll' }}>
                      <Flex flexDirection="column" marginTop="20px" sx={{ gap: '20px' }}>
                        <Flex fontSize={14} color={theme.subText} padding="16px" alignItems="center" margin="auto">
                          <Info size="36px" />
                          <Text lineHeight={1.5} marginLeft="1rem" flex={1}>
                            <Trans>
                              You don&apos;t have any relevant liquidity positions that cover this price range.
                              <br />
                              Add liquidity to this pool with the current range{' '}
                              <StyledInternalLink to={addliquidityElasticPool}>here ↗</StyledInternalLink>{' '}
                            </Trans>
                          </Text>
                        </Flex>
                        <Divider />
                        <Flex
                          paddingX="24px"
                          sx={{ gap: '1rem' }}
                          flexDirection="column"
                          marginBottom="24px"
                          fontSize="12px"
                        >
                          <Text fontSize="12px" fontWeight="500">
                            <Trans>Example</Trans>
                          </Text>

                          <img src={upToMedium ? ExampleImageMobile : ExampleImage} width="100%" />

                          <Text color={theme.subText}>
                            <Trans>
                              For a farm with a pre-configured price range of 0.6-0.8, your liquidity positions lower
                              range must be ≤0.6 and upper range must be ≥0.8
                            </Trans>
                          </Text>

                          <Flex sx={{ gap: '1rem' }} flexDirection={upToMedium ? 'column' : 'row'}>
                            <Flex sx={{ gap: '4px' }}>
                              <Text color={theme.primary} fontWeight="500">
                                <Trans>Eligible</Trans>:
                              </Text>
                              <Text color={theme.subText}>0.6-0.8, 0.5-0.8, 0.5-0.9</Text>
                            </Flex>
                            <Flex sx={{ gap: '4px' }}>
                              <Text color={theme.warning} fontWeight="500">
                                <Trans>Not Eligible</Trans>:
                              </Text>
                              <Text color={theme.subText}>0.6-0.7, 0.7-0.8, 0.65-0.75</Text>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Flex>
                    </div>
                  ) : (
                    <>
                      <PositionTableHeader>
                        <Text display="flex" alignItems="center" sx={{ gap: '6px' }}>
                          <CheckBox
                            disabled={false}
                            ref={checkAllRef}
                            onChange={e => {
                              if (e.currentTarget.checked) {
                                setSelectedNfts(availablePositions.map(item => item.id))
                              } else {
                                setSelectedNfts([])
                              }
                            }}
                          />
                          ID
                        </Text>
                        <Text textAlign="right">
                          <Trans>AVAILABLE BALANCE</Trans>
                        </Text>
                        <Text textAlign="right">
                          <Trans>STAKED BALANCE</Trans>
                        </Text>
                        <Text textAlign="right">
                          <Trans>PRICE RANGE</Trans>
                        </Text>
                      </PositionTableHeader>

                      {availablePositions.map(pos => {
                        const stakedPercent = new Percent(pos.stakedLiq, pos.liquidity)
                        const amount0 = CurrencyAmount.fromRawAmount(farm.token0, pos.amount0)
                        const amount1 = CurrencyAmount.fromRawAmount(farm.token1, pos.amount1)

                        const stakedAmount0 = amount0.multiply(stakedPercent)
                        const stakedAmount1 = amount1.multiply(stakedPercent)
                        const availableAmount0 = amount0.subtract(stakedAmount0)
                        const availableAmount1 = amount1.subtract(stakedAmount1)

                        return (
                          <PositionTableRow key={pos.id}>
                            <Text display="flex" alignItems="center" sx={{ gap: '6px' }}>
                              <CheckBox
                                checked={selectedNfts.includes(pos.id)}
                                onChange={e => {
                                  const tmp = selectedNfts.filter(item => item !== pos.id)
                                  if (e.currentTarget.checked) setSelectedNfts([...tmp, pos.id])
                                  else setSelectedNfts(tmp)
                                }}
                              />
                              <Tag color={pos.outOfRange ? theme.warning : theme.primary}>ID {pos.id}</Tag>
                            </Text>

                            <Flex justifyContent="flex-end">
                              <MouseoverTooltip
                                placement="bottom"
                                width="fit-content"
                                text={
                                  <Flex flexDirection="column" sx={{ gap: '8px' }} width="fit-content">
                                    <Flex sx={{ gap: '4px' }} alignItems="center">
                                      <CurrencyLogo currency={amount0.currency} size="14px" />
                                      <Text>
                                        {formatDisplayNumber(availableAmount0.toExact(), {
                                          style: 'decimal',
                                          significantDigits: 6,
                                        })}{' '}
                                        {amount0.currency.symbol}
                                      </Text>
                                    </Flex>

                                    <Flex sx={{ gap: '4px' }} alignItems="center">
                                      <CurrencyLogo currency={amount1.currency} size="14px" />
                                      <Text>
                                        {formatDisplayNumber(availableAmount1.toExact(), {
                                          style: 'decimal',
                                          significantDigits: 6,
                                        })}{' '}
                                        {amount1.currency.symbol}
                                      </Text>
                                    </Flex>
                                  </Flex>
                                }
                              >
                                {formatDisplayNumber(+pos.amountUSD - (+pos.stakedUSD || 0), {
                                  style: 'currency',
                                  significantDigits: 4,
                                })}
                                <DropdownSVG />
                              </MouseoverTooltip>
                            </Flex>

                            <Flex justifyContent="flex-end">
                              <MouseoverTooltip
                                placement="bottom"
                                width="fit-content"
                                text={
                                  <Flex flexDirection="column" sx={{ gap: '8px' }} width="fit-content">
                                    <Flex sx={{ gap: '4px' }} alignItems="center">
                                      <CurrencyLogo currency={amount0.currency} size="14px" />
                                      <Text>
                                        {formatDisplayNumber(stakedAmount0.toExact(), {
                                          style: 'decimal',
                                          significantDigits: 6,
                                        })}{' '}
                                        {amount0.currency.symbol}
                                      </Text>
                                    </Flex>

                                    <Flex sx={{ gap: '4px' }} alignItems="center">
                                      <CurrencyLogo currency={amount1.currency} size="14px" />
                                      <Text>
                                        {formatDisplayNumber(stakedAmount1.toExact(), {
                                          style: 'decimal',
                                          significantDigits: 6,
                                        })}{' '}
                                        {amount1.currency.symbol}
                                      </Text>
                                    </Flex>
                                  </Flex>
                                }
                              >
                                {formatDisplayNumber(+pos.stakedUSD || 0, { style: 'currency', significantDigits: 4 })}
                                <DropdownSVG />
                              </MouseoverTooltip>
                            </Flex>
                          </PositionTableRow>
                        )
                      })}
                    </>
                  ),
                }
              })}
          />
        </PositionTable>

        <Flex justifyContent="space-between" alignItems="center" fontSize="14px" fontWeight="500">
          <ExternalLink href="/TODO">
            <Trans>Get pool info ↗</Trans>
          </ExternalLink>

          {!account ? (
            <ButtonLight padding="8px 16px" width="max-content" onClick={() => toggleWalletModal()}>
              <Text as="span" width="max-content">
                <Trans>Connect</Trans>
              </Text>
            </ButtonLight>
          ) : farmChainId !== chainId ? (
            <ButtonLight padding="8px 16px" width="max-content" onClick={() => changeNetwork(farmChainId)}>
              <Text as="span" width="max-content">
                <Trans>Switch to {farm.chain.name}</Trans>
              </Text>
            </ButtonLight>
          ) : checkingAllowance ? (
            <ButtonPrimary disabled width="max-content" padding="8px 16px">
              <Dots>Checking Allowance</Dots>
            </ButtonPrimary>
          ) : approving || (approvalTx && isApprovalTxPending) ? (
            <ButtonPrimary disabled width="max-content" padding="8px 16px">
              <Dots>
                <Trans>Approving</Trans>
              </Dots>
            </ButtonPrimary>
          ) : !isApproved ? (
            <ButtonPrimary
              width="max-content"
              padding="8px 16px"
              onClick={async () => {
                setApproving(true)
                const tx = await approve()
                if (tx) {
                  setApprovalTx(tx)
                }
                setApproving(false)
              }}
            >
              <Trans>Approve</Trans>
            </ButtonPrimary>
          ) : (
            <ButtonPrimary
              padding="8px 16px"
              width="max-content"
              disabled={!selectedNfts.length || staking}
              onClick={async () => {
                try {
                  if (!contract) return
                  setStaking(true)
                  let hash = ''
                  const estimateGas = await contract.estimateGas.deposit(
                    farm.fid,
                    activeRange.index,
                    selectedNfts,
                    account,
                  )
                  const tx = await contract.deposit(farm.fid, activeRange.index, selectedNfts, account, {
                    gasLimit: calculateGasMargin(estimateGas),
                  })
                  hash = tx.hash

                  addTransactionWithType({
                    hash,
                    type: TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY,
                  })
                  setStaking(false)
                  onDismiss()
                } catch (error) {
                  console.error(error)
                  setStaking(false)
                  const message = friendlyError(error)
                  notify(
                    {
                      title: t`Deposit Farm Error`,
                      summary: message,
                      type: NotificationType.ERROR,
                    },
                    8000,
                  )
                }
              }}
            >
              {staking ? (
                <Dots>
                  <Trans>Staking</Trans>
                </Dots>
              ) : (
                <Trans>Stake Selected</Trans>
              )}
            </ButtonPrimary>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
