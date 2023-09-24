import { Trans } from '@lingui/macro'

import { ReactComponent as PartnerFarmSvg } from 'assets/svg/partner-farm.svg'
import { MouseoverTooltip } from 'components/Tooltip'
import { FeeTag } from 'components/YieldPools/ElasticFarmGroup/styleds'
import { FRAX_FARMS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ExternalLink } from 'theme'

export const PartnerFarmTag = ({ farmPoolAddress }: { farmPoolAddress: string }) => {
  const { chainId } = useActiveWeb3React()
  const isFraxFarm = FRAX_FARMS[chainId]?.map(address => address.toLowerCase()).includes(farmPoolAddress.toLowerCase())
  if (!isFraxFarm) return null

  return (
    <div style={{ cursor: 'pointer' }}>
      <MouseoverTooltip
        text={
          <Trans>
            KyberSwap Frax farms do not currently receive KNC incentives. They are continuously available for staking so
            that users can participate in KyberSwap Frax gauges to earn FXS emissions. The amount of FXS emissions
            depends on the results of each weekly Frax gauge voting cycle. More info:{' '}
            <ExternalLink href="https://app.frax.finance/gauge">https://app.frax.finance/gauge</ExternalLink> and{' '}
            <ExternalLink href="https://docs.frax.finance/vefxs/gauge">
              https://docs.frax.finance/vefxs/gauge
            </ExternalLink>
          </Trans>
        }
        placement="top"
        width="300px"
      >
        <FeeTag>
          <PartnerFarmSvg />
          Partner Farm
        </FeeTag>
      </MouseoverTooltip>
    </div>
  )
}
