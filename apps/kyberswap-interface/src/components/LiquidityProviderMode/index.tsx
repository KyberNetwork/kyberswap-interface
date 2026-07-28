import { Trans } from '@lingui/macro'

import InfoHelper from 'components/InfoHelper'
import { TabContainer, TabItem } from 'components/PoolList/styled'
import useTheme from 'hooks/useTheme'

const LiquidityProviderMode = ({
  activeTab,
  setActiveTab,
  singleTokenInfo,
  zapout,
}: {
  activeTab: number
  setActiveTab: (activeTab: number) => void
  singleTokenInfo: string
  zapout?: boolean
}) => {
  const theme = useTheme()
  return (
    <TabContainer className="p-1">
      <TabItem active={activeTab === 0} onClick={() => setActiveTab(0)} role="button" className="p-2">
        <Trans>Token Pair</Trans>
      </TabItem>
      <TabItem active={activeTab === 1} onClick={() => setActiveTab(1)} role="button" className="p-2">
        {zapout ? <Trans>Zap Out</Trans> : <Trans>Zap In</Trans>}
        <InfoHelper
          text={singleTokenInfo}
          size={12}
          isActive={activeTab === 1}
          color={activeTab === 1 ? theme.text : theme.subText}
        />
      </TabItem>
    </TabContainer>
  )
}

export default LiquidityProviderMode
