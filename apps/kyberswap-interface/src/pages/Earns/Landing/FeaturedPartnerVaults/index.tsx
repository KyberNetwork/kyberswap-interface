import { t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import EtherFiLogo from 'assets/svg/earn/ic_logo_etherfi.svg'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import {
  PartnerVaultsList,
  VaultCard,
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
  },
  {
    id: 'usd-yield',
    token: '$ USD',
    label: 'Yield',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    tokenIcon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    apr: '5.28%',
  },
  {
    id: 'btc-yield',
    token: 'BTC',
    label: 'Yield (soon)',
    partner: 'ether.fi',
    partnerLogo: EtherFiLogo,
    tokenIcon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    apr: '2.03%',
    disabled: true,
  },
]

const VaultItem = ({ vault }: { vault: VaultData }) => {
  const theme = useTheme()

  return (
    <VaultCard>
      <Flex alignItems="flex-start" justifyContent="space-between" width="100%">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <TokenLogo src={vault.tokenIcon} alt={vault.token} size={24} />
          <Text fontSize={16} color={theme.text}>
            {vault.token}
          </Text>
          <Text fontSize={16} color={theme.subText}>
            {vault.label}
          </Text>
        </Flex>

        <Flex alignItems="center" sx={{ gap: '8px' }}>
          <Text fontSize={16} color={theme.subText}>
            APR
          </Text>
          <Text fontSize={18} color={theme.primary} fontWeight={500} lineHeight="24px">
            {vault.apr}
          </Text>
        </Flex>
      </Flex>

      <Flex alignItems="center" justifyContent="space-between" width="100%">
        <VaultProtocolTag>
          <TokenLogo src={vault.partnerLogo} alt={vault.partner} size={12} />
          <Text fontSize={12} color={theme.subText}>
            {`managed by ${vault.partner}`}
          </Text>
        </VaultProtocolTag>
        <VaultDepositButton $disabled={vault.disabled}>{t`+ Deposit`}</VaultDepositButton>
      </Flex>
    </VaultCard>
  )
}

const VaultItemSkeleton = () => (
  <VaultCard>
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <PositionSkeleton width={24} height={24} style={{ borderRadius: '50%' }} />
        <PositionSkeleton width={40} height={16} />
        <PositionSkeleton width={30} height={16} />
      </Flex>
      <PositionSkeleton width={80} height={20} />
    </Flex>
    <Flex alignItems="center" justifyContent="space-between" width="100%">
      <PositionSkeleton width={120} height={18} />
      <PositionSkeleton width={72} height={24} />
    </Flex>
  </VaultCard>
)

const FeaturedPartnerVaults = ({ isLoading }: { isLoading?: boolean }) => {
  return (
    <PartnerVaultsList>
      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <VaultItemSkeleton key={i} />)
        : SAMPLE_VAULTS.map(vault => <VaultItem key={vault.id} vault={vault} />)}
    </PartnerVaultsList>
  )
}

export default FeaturedPartnerVaults
