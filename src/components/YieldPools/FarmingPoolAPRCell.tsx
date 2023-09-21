import { Fraction } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Placement } from '@popperjs/core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Farm } from 'state/farms/classic/types'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { useFarmApr } from 'utils/dmm'
import { formatDisplayNumber } from 'utils/numbers'

export const APRTooltipContent = ({
  poolAPR,
  farmAPR,
  farmV2APR = 0,
}: {
  poolAPR: number
  farmAPR: number
  farmV2APR?: number
}) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const maxFarmAPR = farmAPR > farmV2APR ? farmAPR : farmV2APR
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        background: theme.tableHeader,
        gap: '8px',
        width: upToSmall ? '300px' : 'fit-content',
      }}
    >
      {(!!farmAPR || !!farmV2APR) && (
        <>
          <Text as="span" fontSize={'14px'}>
            Total APR:{' '}
            <Text as="span" color={theme.text} fontWeight={500}>
              {formatDisplayNumber((poolAPR + maxFarmAPR) / 100, { style: 'percent', fractionDigits: 2 })}
            </Text>
          </Text>
          <Box
            sx={{
              width: '100%',
              borderBottom: `1px solid ${theme.border}`,
            }}
          ></Box>
        </>
      )}

      <Flex
        sx={{
          flexDirection: 'column',
          fontSize: '12px',
          lineHeight: '16px',
        }}
      >
        <Text as="span">
          Pool APR:{' '}
          <Text as="span" color={theme.text} fontWeight={500}>
            {formatDisplayNumber(poolAPR / 100, { style: 'percent', fractionDigits: 2 })}
          </Text>
        </Text>
        <Text
          as="span"
          fontStyle="italic"
          sx={{
            whiteSpace: upToSmall ? 'wrap' : 'nowrap',
          }}
        >
          <Trans>Estimated return from trading fees if you participate in the pool</Trans>
        </Text>
      </Flex>

      {!!maxFarmAPR && (
        <Flex
          sx={{
            flexDirection: 'column',
            fontSize: '12px',
            lineHeight: '16px',
          }}
        >
          <Text as="span" color={theme.warning}>
            Farm APR:{' '}
            <Text as="span" fontWeight={500}>
              {formatDisplayNumber(maxFarmAPR / 100, { style: 'percent', fractionDigits: 2 })}
            </Text>
          </Text>
          <Text
            as="span"
            fontStyle="italic"
            sx={{
              whiteSpace: upToSmall ? 'wrap' : 'nowrap',
            }}
          >
            <Trans>Estimated return from additional rewards if you also participate in the farm</Trans>
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

type Props = {
  poolAPR: number
  farmV1APR?: number
  farmV2APR?: number
  fairlaunchAddress: string
  pid: number
  tooltipPlacement?: Placement
}

const FarmingPoolAPRCell: React.FC<Props> = ({
  poolAPR,
  farmV1APR,
  farmV2APR = 0,
  fairlaunchAddress,
  pid,
  tooltipPlacement = 'right',
}) => {
  const { farms } = useElasticFarms()

  const pool = farms
    ?.find(farm => farm.id.toLowerCase() === fairlaunchAddress.toLowerCase())
    ?.pools.find(pool => Number(pool.pid) === Number(pid))

  const tokenPrices = useTokenPrices(
    [
      pool?.token0.wrapped.address,
      pool?.token1.wrapped.address,
      ...(pool?.rewardTokens.map(rw => rw.wrapped.address) || []),
    ].filter(address => !!address) as string[],
  )

  let farmAPR = farmV1APR || 0
  if (pool && !farmV1APR) {
    const totalRewardValue = pool.totalRewards.reduce(
      (total, rw) => total + Number(rw.toExact()) * tokenPrices[rw.currency.wrapped.address],
      0,
    )

    const farmDuration = (pool.endTime - pool.startTime) / 86400
    farmAPR = (365 * 100 * (totalRewardValue || 0)) / farmDuration / pool.poolTvl
  }

  const maxFarmAPR = farmAPR > farmV2APR ? farmAPR : farmV2APR

  return (
    <Flex
      alignItems={'center'}
      sx={{
        gap: '4px',
      }}
    >
      <MouseoverTooltip
        width="fit-content"
        placement={tooltipPlacement}
        text={<APRTooltipContent farmAPR={maxFarmAPR} poolAPR={poolAPR} />}
      >
        <Text as="span" marginRight="4px">
          {formatDisplayNumber((poolAPR + maxFarmAPR) / 100, { style: 'percent', fractionDigits: 2 })}
        </Text>
        <Info size={14} />
      </MouseoverTooltip>
    </Flex>
  )
}

export const ClassicFarmingPoolAPRCell = ({ poolAPR, farm }: { poolAPR: number; farm: Farm }) => {
  const theme = useTheme()
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)),
  ).divide(
    new Fraction(parseUnits(farm.totalSupply, 18).toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))),
  )
  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const farmAPR = useFarmApr(farm, liquidity.toString())

  return (
    <Flex
      alignItems={'center'}
      sx={{
        gap: '4px',
      }}
    >
      <Text as="span">{formatDisplayNumber((poolAPR + farmAPR) / 100, { style: 'percent', fractionDigits: 2 })}</Text>
      <MouseoverTooltip width="fit-content" text={<APRTooltipContent farmAPR={farmAPR} poolAPR={poolAPR} />}>
        <MoneyBag size={16} color={theme.apr} />
      </MouseoverTooltip>
    </Flex>
  )
}

export default FarmingPoolAPRCell
