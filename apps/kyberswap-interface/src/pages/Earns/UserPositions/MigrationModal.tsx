import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import Modal from 'components/Modal'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
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
  const theme = useTheme()

  return (
    <Modal isOpen width="768px" maxWidth={1000} onDismiss={onClose}>
      <MigrateTableWrapper>
        <ContentWrapper>
          {!upToSmall && (
            <MigrateTableHeader>
              <Text>Pair</Text>
              <Text>{t`APR`}</Text>
              <Flex justifyContent="flex-end">{t`Earn Fees`}</Flex>
              <Flex justifyContent="flex-end">{t`TVL`}</Flex>
              <Flex justifyContent="flex-end">{t`Volume`}</Flex>
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
                        poolExchange: pool.exchange,
                        token0: {
                          decimals: pool.tokens?.[0]?.decimals || 0,
                        },
                        token1: {
                          decimals: pool.tokens?.[1]?.decimals || 0,
                        },
                      })
                    }
                  >
                    <Flex alignItems="center" sx={{ gap: 2 }}>
                      <Flex alignItems="center">
                        <TokenLogo src={pool.tokens?.[0]?.logoURI} />
                        <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
                      </Flex>
                      <SymbolText>
                        {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                      </SymbolText>
                      <FeeTier>{formatDisplayNumber(pool.feeTier, { significantDigits: 4 })}%</FeeTier>
                    </Flex>
                    <Apr value={pool.apr}>
                      {formatAprNumber(pool.apr)}%{' '}
                      {isFarming ? (
                        <AprDetailTooltip feeApr={pool.apr} egApr={pool.kemEGApr || 0} lmApr={pool.kemLMApr || 0}>
                          {isFarmingLm ? (
                            <FarmingLmIcon width={20} height={20} />
                          ) : (
                            <FarmingIcon width={20} height={20} />
                          )}
                        </AprDetailTooltip>
                      ) : null}
                    </Apr>
                    <Flex justifyContent="flex-end">
                      {formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}
                    </Flex>
                    <Flex justifyContent="flex-end">
                      {formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}
                    </Flex>
                    <Flex justifyContent="flex-end">
                      {formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}
                    </Flex>
                  </MigrateTableRow>
                )
              })}

            {upToSmall &&
              farmingPools.map((pool: EarnPool, index: number) => {
                const isFarming = pool.programs?.includes(ProgramType.EG) || pool.programs?.includes(ProgramType.LM)
                const isFarmingLm = pool.programs?.includes(ProgramType.LM)

                return (
                  <MobileTableRow
                    key={pool.address}
                    onClick={() =>
                      onOpenMigration(positionToMigrate, {
                        address: pool.address,
                        feeTier: pool.feeTier,
                        poolExchange: pool.exchange,
                        token0: {
                          decimals: pool.tokens?.[0]?.decimals || 0,
                        },
                        token1: {
                          decimals: pool.tokens?.[1]?.decimals || 0,
                        },
                      })
                    }
                  >
                    <Flex alignItems="flex-start" justifyContent="space-between">
                      <Flex sx={{ gap: 1 }}>
                        <Flex sx={{ position: 'relative', top: -1 }}>
                          <TokenLogo src={pool.tokens?.[0]?.logoURI} />
                          <TokenLogo src={pool.tokens?.[1]?.logoURI} translateLeft />
                        </Flex>
                        <SymbolText>
                          {pool.tokens?.[0]?.symbol}/{pool.tokens?.[1]?.symbol}
                        </SymbolText>
                      </Flex>
                      <Flex alignItems="center" sx={{ gap: '2px' }}>
                        <Apr value={pool.apr}>{formatAprNumber(pool.apr)}%</Apr>
                        {isFarming ? (
                          <AprDetailTooltip feeApr={pool.apr} egApr={pool.kemEGApr || 0} lmApr={pool.kemLMApr || 0}>
                            {isFarmingLm ? (
                              <FarmingLmIcon width={20} height={20} />
                            ) : (
                              <FarmingIcon width={20} height={20} />
                            )}
                          </AprDetailTooltip>
                        ) : null}
                      </Flex>
                    </Flex>
                    <MobileTableBottomRow withoutBorder={index === farmingPools.length - 1}>
                      <Flex justifyContent="space-between" sx={{ gap: 1 }}>
                        <Text color={theme.subText}>Earn Fees</Text>
                        <Text>{formatDisplayNumber(pool.earnFee, { style: 'currency', significantDigits: 6 })}</Text>
                      </Flex>
                      <Flex justifyContent="space-between" sx={{ gap: 1 }}>
                        <Text color={theme.subText}>TVL</Text>
                        <Text>{formatDisplayNumber(pool.tvl, { style: 'currency', significantDigits: 6 })}</Text>
                      </Flex>
                      <Flex justifyContent="space-between" sx={{ gap: 1 }}>
                        <Text color={theme.subText}>Volume</Text>
                        <Text>{formatDisplayNumber(pool.volume, { style: 'currency', significantDigits: 6 })}</Text>
                      </Flex>
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
