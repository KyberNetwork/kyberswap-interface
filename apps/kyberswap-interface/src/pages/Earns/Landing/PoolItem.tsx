import { formatAprNumber } from '@kyber/utils/dist/number'
import { ChainId } from '@kyberswap/ks-sdk-core'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { PoolRow, Tag } from 'pages/Earns/Landing/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import useSmartExitWidget from 'pages/Earns/hooks/useSmartExitWidget'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { EarnPool, ProgramType } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const PoolItem = ({ pool }: { pool: EarnPool }) => {
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()
  const { onOpenSmartExit, smartExitWidget } = useSmartExitWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
    triggerClose,
    setTriggerClose,
    onOpenSmartExit,
  })

  const isFarming = pool.programs?.includes(ProgramType.EG) || pool.programs?.includes(ProgramType.LM)
  const isFarmingLm = pool.programs?.includes(ProgramType.LM)

  return (
    <PoolRow
      className="justify-between"
      key={pool.address}
      role="button"
      onClick={e => {
        e.stopPropagation()
        handleOpenZapIn({
          pool: {
            dex: pool.exchange,
            chainId: pool.chainId as number,
            address: pool.address,
          },
        })
      }}
    >
      {zapInWidget}
      {zapMigrationWidget}
      {smartExitWidget}
      <div className="flex flex-1 items-center gap-1">
        <TokenLogo src={pool.tokens?.[0].logoURI} size={24} />
        <TokenLogo src={pool.tokens?.[1].logoURI} size={24} translateLeft />
        <TokenLogo
          src={NETWORKS_INFO[pool.chainId as ChainId].icon}
          size={12}
          translateLeft
          style={{ alignSelf: 'flex-end', position: 'relative', top: 1 }}
        />

        <span className="truncate text-left">
          {pool.tokens?.[0].symbol} / <span className="text-subText">{pool.tokens?.[1].symbol}</span>
        </span>
        <Tag>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</Tag>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-primary">{formatAprNumber(pool.allApr)}%</span>
        {isFarming ? (
          <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
            {isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />}
          </AprDetailTooltip>
        ) : null}
      </div>
    </PoolRow>
  )
}

export default PoolItem
