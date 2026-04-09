import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { ReactComponent as FeaturedVaultIcon } from 'assets/svg/earn/ic_featured_vault.svg'
import EtherFiLogo from 'assets/svg/earn/ic_logo_etherfi.svg'
import useTheme from 'hooks/useTheme'
import {
  FeaturedVaultsContainer,
  FeaturedVaultsHeader,
  VaultCard,
  VaultCardsGrid,
  VaultDepositButton,
  VaultProtocolTag,
} from 'pages/Earns/Landing/FeaturedPartnerVaults/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'

interface VaultData {
  id: string
  token: string
  label: string
  partner: string
  partnerLogo: string
  tokenIcon: string
  apr: string
  tvl: string
  disabled?: boolean
}

const SAMPLE_VAULTS: VaultData[] = [
  {
    id: 'eth-yield',
    token: 'ETH',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    tokenIcon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    apr: '2.47%',
    tvl: '$280M',
  },
  {
    id: 'usd-yield',
    token: '$ USD',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    tokenIcon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    apr: '5.28%',
    tvl: '$113M',
  },
  {
    id: 'btc-yield',
    token: 'BTC',
    label: 'Yield (soon)',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    tokenIcon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    apr: '2.03%',
    tvl: '$31.5M',
    disabled: true,
  },
]

const VaultItem = ({ vault }: { vault: VaultData }) => {
  const theme = useTheme()

  return (
    <VaultCard>
      <Flex flexDirection="column" style={{ gap: '8px', width: '100%' }}>
        <Flex alignItems="center" flexWrap="wrap" style={{ gap: '8px' }}>
          <Flex alignItems="center" style={{ gap: '4px' }}>
            <img src={vault.tokenIcon} alt={vault.token} width={24} height={24} style={{ borderRadius: '50%' }} />
            <Text fontSize={14} color={theme.text}>
              {vault.token}
            </Text>
            <Text fontSize={14} color={theme.border}>
              {vault.label}
            </Text>
          </Flex>
          <VaultProtocolTag>
            <img src={vault.partnerLogo} alt={vault.partner} width={12} height={12} style={{ borderRadius: '50%' }} />
            <Text fontSize={12} color={theme.subText}>
              {`managed by ${vault.partner}`}
            </Text>
          </VaultProtocolTag>
        </Flex>

        <Flex alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" style={{ gap: '8px' }} width="100%">
          <Flex alignItems="center" style={{ gap: '16px' }}>
            <Flex alignItems="center" style={{ gap: '8px' }}>
              <Text fontSize={14} color={theme.border}>
                APR
              </Text>
              <Text fontSize={16} color={theme.primary} fontWeight={400}>
                {vault.apr}
              </Text>
            </Flex>
            <Flex alignItems="center" style={{ gap: '4px' }}>
              <Text fontSize={14} color={theme.border}>
                TVL
              </Text>
              <Text fontSize={14} color={theme.text}>
                {vault.tvl}
              </Text>
            </Flex>
          </Flex>

          <VaultDepositButton $disabled={vault.disabled}>{t`+ Deposit`}</VaultDepositButton>
        </Flex>
      </Flex>
    </VaultCard>
  )
}

const VaultItemSkeleton = () => (
  <VaultCard>
    <Flex flexDirection="column" style={{ gap: '8px', width: '100%' }}>
      <Flex alignItems="center" style={{ gap: '8px' }}>
        <Flex alignItems="center" style={{ gap: '4px' }}>
          <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
          <PositionSkeleton width={40} height={16} />
          <PositionSkeleton width={30} height={16} />
        </Flex>
        <PositionSkeleton width={100} height={20} />
      </Flex>
      <Flex alignItems="center" justifyContent="space-between" width="100%">
        <Flex alignItems="center" style={{ gap: '16px' }}>
          <PositionSkeleton width={70} height={16} />
          <PositionSkeleton width={60} height={16} />
        </Flex>
        <PositionSkeleton width={72} height={28} />
      </Flex>
    </Flex>
  </VaultCard>
)

const FeaturedPartnerVaults = ({ isLoading }: { isLoading?: boolean }) => {
  return (
    <FeaturedVaultsContainer>
      <FeaturedVaultsHeader>
        <FeaturedVaultIcon width={24} height={24} color={'#8F92FF'} />
        <Text fontSize={20} fontWeight={500}>{t`Featured Partner Vaults (ether.fi)`}</Text>
      </FeaturedVaultsHeader>

      <VaultCardsGrid>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <VaultItemSkeleton key={i} />)
          : SAMPLE_VAULTS.map(vault => <VaultItem key={vault.id} vault={vault} />)}
      </VaultCardsGrid>
    </FeaturedVaultsContainer>
  )
}

export default FeaturedPartnerVaults
