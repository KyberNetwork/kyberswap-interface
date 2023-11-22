import { defaultAbiCoder } from '@ethersproject/abi'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Interface } from 'ethers/lib/utils'
import { useMemo, useState } from 'react'
import { X } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import { NormalizedFarm } from 'services/knprotocol'

import { NotificationType } from 'components/Announcement/type'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Harvest from 'components/Icons/Harvest'
import Modal from 'components/Modal'
import Tabs from 'components/Tabs'
import PROMM_FARM_ABI from 'constants/abis/v2/farm.json'
import FarmV2ABI from 'constants/abis/v2/farmv2.json'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ProtocolType } from 'hooks/farms/useFarmFilters'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { ButtonText, ExternalLink } from 'theme'
import { calculateGasMargin } from 'utils'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber } from 'utils/numbers'

import { ChainLogo, FilterGroup, FilterItem, PositionTable, Tag } from '../styled'
import { getFeeOrAMPTag } from './FarmTableRow'

const DynamicFarmInterface = new Interface(PROMM_FARM_ABI)
const FarmV2Interface = new Interface(FarmV2ABI)

export default function HarvestModal({
  farms,
  onDismiss,
  farmToHarvest,
}: {
  farms: NormalizedFarm[]
  onDismiss: () => void
  farmToHarvest?: NormalizedFarm
}) {
  const theme = useTheme()
  const addTransactionWithType = useTransactionAdder()
  const notify = useNotify()
  const { chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()

  const protocols = [...new Set(farms.map(item => item.protocol))].sort()
  const [selectedProtocol, setSelectedProtocol] = useState(farmToHarvest?.protocol || protocols[0])

  const chainIdsByProtocol = useMemo(() => {
    const res = {} as { [key: string]: ChainId[] }
    farms.forEach(farm => {
      if (res[farm.protocol]) {
        if (!res[farm.protocol].includes(farm.chain.chainId))
          res[farm.protocol] = [...res[farm.protocol], farm.chain.chainId].sort()
      } else res[farm.protocol] = [farm.chain.chainId]
    })
    return res
  }, [farms])

  const [selectedChainByProtocol, setSelectedChainByProtocol] = useState<{ [key: string]: ChainId }>(() => {
    return protocols.reduce(
      (acc, cur) => ({
        ...acc,
        [cur]:
          farmToHarvest && cur === farmToHarvest.protocol ? farmToHarvest.chain.chainId : chainIdsByProtocol[cur][0],
      }),
      {},
    )
  })

  const farmsToShow = farms.filter(
    item => item.protocol === selectedProtocol && item.chain.chainId === selectedChainByProtocol[selectedProtocol],
  )

  const { library } = useWeb3React()
  const [loading, setLoading] = useState(false)
  const harvestAll = async () => {
    if (!library) return
    const nftIds: string[] = []
    const poolIds: string[] = []
    farmsToShow.forEach(farm => {
      farm.positions.forEach(pos => {
        pos.joinedPositions?.forEach(jp => {
          nftIds.push(pos.id)
          poolIds.push(jp.pid)
        })
      })
    })

    const encodePIds = poolIds.map(id => defaultAbiCoder.encode(['tupple(uint256[] pIds)'], [{ pIds: [id] }]))
    const encodeData = DynamicFarmInterface.encodeFunctionData('harvestMultiplePools', [nftIds, encodePIds])
    const tx = {
      to: farmsToShow[0].farmAddress,
      data: encodeData,
    }

    try {
      setLoading(true)
      const gas = await library.getSigner().estimateGas(tx)
      const res = await library.getSigner().sendTransaction({
        ...tx,
        gasLimit: calculateGasMargin(gas),
      })
      addTransactionWithType({
        hash: res.hash,
        type: TRANSACTION_TYPE.HARVEST,
      })
      setLoading(false)
      onDismiss()
    } catch (error) {
      console.error(error)
      setLoading(false)
      const message = friendlyError(error)
      notify(
        {
          title: t`Harvest Error`,
          summary: message,
          type: NotificationType.ERROR,
        },
        8000,
      )
    }
  }

  const [harvestingId, setHarvestingId] = useState('')
  const harvestStaticReward = async (farm: NormalizedFarm) => {
    if (!library) return
    const encodedData = FarmV2Interface.encodeFunctionData('claimReward', [
      farm.fid,
      farm.positions.map(item => item.id),
    ])

    const tx = {
      to: farm.farmAddress,
      data: encodedData,
    }

    try {
      setHarvestingId(farm.id)
      const gas = await library.getSigner().estimateGas(tx)
      const res = await library.getSigner().sendTransaction({
        ...tx,
        gasLimit: calculateGasMargin(gas),
      })
      addTransactionWithType({
        hash: res.hash,
        type: TRANSACTION_TYPE.HARVEST,
      })
      setHarvestingId('')
      onDismiss()
    } catch (error) {
      console.error(error)
      setHarvestingId('')
      const message = friendlyError(error)
      notify(
        {
          title: t`Harvest Error`,
          summary: message,
          type: NotificationType.ERROR,
        },
        8000,
      )
    }
  }

  return (
    <Modal isOpen onDismiss={onDismiss} maxWidth="900px" width="100vw">
      <Flex width="100%" padding="20px" flexDirection="column" sx={{ gap: '20px' }} backgroundColor={theme.background}>
        <Flex justifyContent="space-between" alignItems="center" width="100%">
          <Text fontSize="20px" fontWeight="500">
            Harvest your rewards
          </Text>
          <ButtonText onClick={onDismiss}>
            <X color={theme.text} />
          </ButtonText>
        </Flex>

        <Text color={theme.subText} fontSize="12px" lineHeight="16px">
          <Trans>
            You can claim all your farming rewards here! Read more <ExternalLink href="/TODO">here ↗</ExternalLink>
          </Trans>
        </Text>

        <FilterGroup>
          {protocols.map(item => (
            <FilterItem active={selectedProtocol === item} onClick={() => setSelectedProtocol(item)} key={item}>
              {item[0].toUpperCase() + item.slice(1)} Farms
            </FilterItem>
          ))}
        </FilterGroup>

        <PositionTable>
          <Tabs
            activeKey={selectedChainByProtocol[selectedProtocol]}
            onChange={key =>
              setSelectedChainByProtocol({ ...selectedChainByProtocol, [selectedProtocol]: +key as ChainId })
            }
            items={chainIdsByProtocol[selectedProtocol].map(id => ({
              key: id,
              label: (
                <Flex alignItems="center" sx={{ gap: '4px' }} padding="0 4px">
                  <img src={NETWORKS_INFO[id].icon} width="20" height="20" />
                  <Text fontWeight="500" fontSize="14px">
                    {NETWORKS_INFO[id].name}
                  </Text>
                </Flex>
              ),
              children: (
                <>
                  <Flex
                    justifyContent="space-between"
                    padding="16px 12px"
                    backgroundColor={theme.tableHeader}
                    fontSize="12px"
                    color={theme.subText}
                    fontWeight="500"
                  >
                    <Text textAlign="right">
                      <Trans>FARMS</Trans>
                    </Text>
                    <Text textAlign="right">
                      <Trans>REWARDS</Trans>
                    </Text>
                  </Flex>

                  {farmsToShow.map(farm => {
                    return (
                      <Flex
                        key={farm.id}
                        justifyContent="space-between"
                        padding="12px"
                        fontSize="14px"
                        fontWeight="500"
                        sx={{
                          borderBottom: `1px solid ${theme.border}`,
                          ':last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Flex alignItems="center" sx={{ gap: '4px' }}>
                          <Box sx={{ position: 'relative' }}>
                            <DoubleCurrencyLogo currency0={farm.token0} currency1={farm.token1} size={20} />
                            <ChainLogo src={farm.chain.icon} size={10} />
                          </Box>
                          <Text>
                            {farm.token0.symbol} - {farm.token1.symbol}
                          </Text>
                          <Tag color={theme.subText}>{getFeeOrAMPTag(farm)}</Tag>
                        </Flex>

                        <Flex alignItems="center" sx={{ gap: '12px' }}>
                          {farm.rewardAmounts.map(item => (
                            <Flex key={item.currency.wrapped.address} alignItems="center" sx={{ gap: '4px' }}>
                              <CurrencyLogo currency={item.currency} size="16px" />
                              {formatDisplayNumber(item.toExact(), { style: 'decimal', significantDigits: 6 })}{' '}
                              {item.currency.symbol}
                            </Flex>
                          ))}

                          {selectedProtocol === ProtocolType.Static && (
                            <ButtonLight
                              width="fit-content"
                              padding="4px 6px"
                              disabled={
                                selectedChainByProtocol[selectedProtocol] !== chainId || harvestingId === farm.id
                              }
                              onClick={() => harvestStaticReward(farm)}
                            >
                              <Harvest />
                              <Text marginLeft="4px" fontSize="12px">
                                {harvestingId === farm.id ? (
                                  <Dots>
                                    <Trans>Harvesting</Trans>
                                  </Dots>
                                ) : (
                                  <Trans>Harvest</Trans>
                                )}
                              </Text>
                            </ButtonLight>
                          )}
                        </Flex>
                      </Flex>
                    )
                  })}
                </>
              ),
            }))}
          />
        </PositionTable>

        <Flex justifyContent="flex-end" alignItems="center" fontSize="14px" fontWeight="500">
          {selectedChainByProtocol[selectedProtocol] !== chainId ? (
            <ButtonLight
              onClick={() => changeNetwork(selectedChainByProtocol[selectedProtocol])}
              padding="8px 16px"
              width="max-content"
            >
              <Trans>Switch to {NETWORKS_INFO[selectedChainByProtocol[selectedProtocol]].name}</Trans>
            </ButtonLight>
          ) : (
            selectedProtocol === ProtocolType.Dynamic && (
              <ButtonPrimary padding="8px 16px" width="max-content" onClick={harvestAll} disabled={loading}>
                {loading ? (
                  <Dots>
                    <Trans>Harvesting</Trans>
                  </Dots>
                ) : (
                  <Trans>Harvest</Trans>
                )}
              </ButtonPrimary>
            )
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
