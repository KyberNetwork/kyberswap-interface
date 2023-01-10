import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Info } from 'react-feather'
import { Text } from 'rebass'

import Column from 'components/Column'
import Loader from 'components/Loader'
import Row from 'components/Row'
import CurrencyList from 'components/SearchModal/CurrencyList'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import useTheme from 'hooks/useTheme'

const tokenItemStyle = { paddingLeft: 0, paddingRight: 0 }

export default function MyAssets({
  tokens,
  loadingTokens,
  usdBalances,
}: {
  tokens: Currency[]
  loadingTokens: boolean
  usdBalances: { [address: string]: number }
}) {
  const theme = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const showModal = () => setModalOpen(true)
  const hideModal = () => setModalOpen(false)

  if (loadingTokens) {
    return (
      <Row style={{ height: 73 }} gap="6px" justify="center">
        <Loader /> <Text color={theme.subText}>Loading tokens...</Text>
      </Row>
    )
  }

  return (
    <>
      <CurrencyList currencies={tokens} itemStyle={tokenItemStyle} showFavoriteIcon={false} usdBalances={usdBalances} />
      <Column gap="6px" style={{ alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
        <Info color={theme.subText} />
        <Text color={theme.subText}>
          <Trans>Don&apos;t see your tokens</Trans>
        </Text>
        <Text color={theme.primary} style={{ cursor: 'pointer' }} onClick={showModal}>
          <Trans>Import tokens</Trans>
        </Text>
      </Column>
      <CurrencySearchModal
        isOpen={modalOpen}
        onDismiss={hideModal}
        onCurrencySelect={hideModal}
        showCommonBases={false}
      />
    </>
  )
}
