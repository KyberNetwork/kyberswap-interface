import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'

import LocalLoader from 'components/LocalLoader'
import FairLaunchPools from 'components/YieldPools/FairLaunchPools'
import { FARM_TAB } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { useFarmsData } from 'state/farms/classic/hooks'
import { Farm } from 'state/farms/classic/types'

import ConfirmHarvestingModal from './ConfirmHarvestingModal'

const YieldPools = ({ loading, active }: { loading: boolean; active?: boolean }) => {
  const theme = useTheme()
  const blockNumber = useBlockNumber()
  // temporary use ref for prevent re-render when block change since farm page is spamming rpc calls
  // todo: fix spam rpc and remove this ref, add blockNumber into deps list
  const blockNumberRef = useRef(blockNumber)
  blockNumberRef.current = blockNumber
  const {
    search = '',
    token0,
    token1,
    ...qs
  } = useParsedQueryString<{ search: string; token0?: string; token1?: string }>()
  const { data: farmsByFairLaunch } = useFarmsData()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>()
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)

  const currentTimestampRef = useRef(0)
  currentTimestampRef.current = Math.floor(Date.now() / 1000)
  const debouncedSearchText = useDebounce(search.trim().toLowerCase(), 200)

  const filterFarm = useCallback(
    (farm: Farm) => {
      const filterByTime = farm.rewardPerSeconds
        ? currentTimestampRef.current &&
          (qs.type === FARM_TAB.MY_FARMS
            ? true
            : active
            ? farm.endTime >= currentTimestampRef.current
            : farm.endTime < currentTimestampRef.current)
        : blockNumberRef.current &&
          (qs.type === FARM_TAB.MY_FARMS
            ? true
            : active
            ? farm.endBlock >= blockNumberRef.current
            : farm.endBlock < blockNumberRef.current)

      const filterBySearchText = debouncedSearchText
        ? farm.token0?.symbol.toLowerCase().includes(debouncedSearchText) ||
          farm.token1?.symbol.toLowerCase().includes(debouncedSearchText) ||
          farm.id === debouncedSearchText
        : true

      const filterByStakedOnly =
        qs.type === FARM_TAB.MY_FARMS
          ? farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
          : true

      const filterByToken0 = token0
        ? farm.token0?.id.toLowerCase() === token0.toLowerCase() ||
          farm.token1?.id.toLowerCase() === token0.toLowerCase()
        : true
      const filterByToken1 = token1
        ? farm.token0?.id.toLowerCase() === token1.toLowerCase() ||
          farm.token1?.id.toLowerCase() === token1.toLowerCase()
        : true

      return filterByTime && filterBySearchText && filterByStakedOnly && filterByToken0 && filterByToken1
    },
    [active, debouncedSearchText, qs.type, token0, token1],
  )

  const farms = useMemo(
    () =>
      Object.keys(farmsByFairLaunch).reduce((acc: { [key: string]: Farm[] }, address) => {
        const currentFarms = farmsByFairLaunch[address].filter(farm => filterFarm(farm))
        if (currentFarms.length) acc[address] = currentFarms
        return acc
      }, {}),
    [farmsByFairLaunch, filterFarm],
  )

  const noFarms = !Object.keys(farms).length

  return (
    <>
      <ConfirmHarvestingModal />

      {loading && noFarms ? (
        <Flex backgroundColor={theme.background}>
          <LocalLoader />
        </Flex>
      ) : noFarms ? (
        <Flex
          backgroundColor={theme.background}
          justifyContent="center"
          padding="32px"
          style={{ borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}
        >
          <Text color={theme.subText}>
            {debouncedSearchText ? <Trans>No Farms found</Trans> : <Trans>Currently there are no Farms.</Trans>}
          </Text>
        </Flex>
      ) : (
        Object.keys(farms).map(fairLaunchAddress => {
          return (
            <FairLaunchPools
              key={fairLaunchAddress}
              fairLaunchAddress={fairLaunchAddress}
              farms={farms[fairLaunchAddress]}
              active={active}
            />
          )
        })
      )}
    </>
  )
}

export default YieldPools
