import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useMedia } from 'react-use'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import Modal from 'components/Modal'
import TokenLogo from 'components/TokenLogo'
import {
  Apr,
  ContentWrapper,
  FeeTier,
  MigrateTableBody,
  MigrateTableHeader,
  MigrateTableRow,
  MigrateTableWrapper,
  MobileTableBottomRow,
  MobileTableRow,
  SymbolText,
} from 'pages/Earns/PoolExplorer/styles'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import { EarnPool, ParsedPosition, ProgramType, SuggestedPool } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function MigrationModal({
  positionToMigrate,
  farmingPools,
  onOpenMigration,
  onClose,
}: {
  positionToMigrate: ParsedPosition
  farmingPools: EarnPool[]
  onOpenMigration: (sourcePosition: ParsedPosition, targetPool: SuggestedPool) => void
  onClose: () => void
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Modal isOpen width="768px" maxWidth={1000} onDismiss={onClose}>
      <MigrateTableWrapper>
        <ContentWrapper>
          {!upToSmall && (
            <MigrateTableHeader>
              <span>{t`Pair`}</span>
              <span>{t`APR`}</span>
              <div className="flex justify-end">{t`Earn Fees`}</div>
              <div className="flex justify-end">{t`TVL`}</div>
              <div className="flex justify-end">{t`Volume`}</div>
            </MigrateTableHeader>
          )}
          <MigrateTableBody>
            {!upToSmall &&
              farmingPools.map((pool: EarnPool) => {
                const isFarming = pool.programs?.includes(ProgramType.EG) || pool.programs?.includes(ProgramType.LM)
                const isFarmingLm = pool.programs?.includes(ProgramType.LM)

                return (
                  <MigrateTableRow
                    key={pool.address}
                    onClick={() =>
                      onOpenMigration(positionToMigrate, {
                        address: pool.address,
                        feeTier: pool.feeTier,
                        exchange: pool.exchange,
                        token0: {
                          address: pool.tokens?.[0]?.address || '',
                          decimals: pool.tokens?.[0]?.decimals || 0,
                        },
                        token1: {
                          address: pool.tokens?.[1]?.address || '',
                          decimals: pool.tokens?.[1]?.decimals || 0,
                        },
                      })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <TokenLogo src={pool.tokens?.[0]?.logoURI} />
                        <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
                      </div>
                      <SymbolText>
                        {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                      </SymbolText>
                      <FeeTier>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</FeeTier>
                    </div>
                    <Apr value={pool.allApr}>
                      {formatAprNumber(pool.allApr)}%{' '}
                      {isFarming ? (
                        <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
                          {isFarmingLm ? (
                            <FarmingLmIcon width={20} height={20} />
                          ) : (
                            <FarmingIcon width={20} height={20} />
                          )}
                        </AprDetailTooltip>
                      ) : null}
                    </Apr>
                    <div className="flex justify-end">
                      {formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}
                    </div>
                    <div className="flex justify-end">
                      {formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}
                    </div>
                    <div className="flex justify-end">
                      {formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}
                    </div>
                  </MigrateTableRow>
                )
              })}

            {upToSmall &&
              farmingPools.map(pool => {
                const isFarming = pool.programs?.includes(ProgramType.EG) || pool.programs?.includes(ProgramType.LM)
                const isFarmingLm = pool.programs?.includes(ProgramType.LM)

                return (
                  <MobileTableRow
                    key={pool.address}
                    onClick={() =>
                      onOpenMigration(positionToMigrate, {
                        address: pool.address,
                        feeTier: pool.feeTier,
                        exchange: pool.exchange,
                        token0: {
                          address: pool.tokens?.[0]?.address || '',
                          decimals: pool.tokens?.[0]?.decimals || 0,
                        },
                        token1: {
                          address: pool.tokens?.[1]?.address || '',
                          decimals: pool.tokens?.[1]?.decimals || 0,
                        },
                      })
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-1">
                        <div className="relative -top-px flex">
                          <TokenLogo src={pool.tokens?.[0]?.logoURI} />
                          <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
                        </div>
                        <SymbolText>
                          {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                        </SymbolText>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Apr value={pool.allApr}>{formatAprNumber(pool.allApr)}%</Apr>
                        {isFarming ? (
                          <AprDetailTooltip feeApr={pool.lpApr} egApr={pool.kemEGApr} lmApr={pool.kemLMApr}>
                            {isFarmingLm ? (
                              <FarmingLmIcon width={20} height={20} />
                            ) : (
                              <FarmingIcon width={20} height={20} />
                            )}
                          </AprDetailTooltip>
                        ) : null}
                      </div>
                    </div>
                    <MobileTableBottomRow>
                      <div className="flex justify-between gap-1">
                        <span className="text-subText">{t`Earn Fees`}</span>
                        <span>{formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className="text-subText">{t`TVL`}</span>
                        <span>{formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className="text-subText">{t`Volume`}</span>
                        <span>{formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}</span>
                      </div>
                    </MobileTableBottomRow>
                  </MobileTableRow>
                )
              })}
          </MigrateTableBody>
        </ContentWrapper>
      </MigrateTableWrapper>
    </Modal>
  )
}
