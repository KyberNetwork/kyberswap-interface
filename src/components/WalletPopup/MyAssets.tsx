import { Currency, CurrencyAmount, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { CurrencyRow } from 'components/SearchModal/CurrencyList'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { ETHER_ADDRESS } from 'constants/index'
import { isEVM } from 'constants/networks'
import useTheme from 'hooks/useTheme'

const tokenItemStyle = { paddingLeft: 0, paddingRight: 0 }
const Wrapper = styled.div`
  width: 100%;
  flex: 1 0 auto;
  overflow-y: auto;
`

export default function MyAssets({
  tokens,
  loadingTokens,
  usdBalances,
  currencyBalances,
}: {
  tokens: Currency[]
  loadingTokens: boolean
  usdBalances: { [address: string]: number }
  currencyBalances: { [address: string]: TokenAmount | undefined }
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
    <Wrapper>
      <AutoSizer>
        {({ height, width }) => (
          <div style={{ height, width }}>
            {tokens.map(token => {
              const address = token.isNative
                ? isEVM(token.chainId)
                  ? ETHER_ADDRESS
                  : WETH[token.chainId].address
                : token.wrapped.address

              const currencyBalance = currencyBalances[address]
              const usdBalance =
                currencyBalance && usdBalances[address]
                  ? usdBalances[address] * parseFloat(currencyBalance.toExact())
                  : undefined
              return (
                <CurrencyRow
                  isSelected={false}
                  key={address}
                  style={tokenItemStyle}
                  currency={token}
                  currencyBalance={currencyBalance as CurrencyAmount<Currency>}
                  showFavoriteIcon={false}
                  usdBalance={usdBalance}
                />
              )
            })}
            <Column
              gap="6px"
              style={{
                alignItems: 'center',
                borderTop: tokens.length ? `1px solid ${theme.border}` : 'none',
                padding: '12px 0',
                marginTop: tokens.length ? 8 : 0,
              }}
            >
              <Info color={theme.subText} />
              <Text color={theme.subText}>
                <Trans>Don&apos;t see your tokens</Trans>
              </Text>
              <Text color={theme.primary} style={{ cursor: 'pointer' }} onClick={showModal}>
                <Trans>Import Tokens</Trans>
              </Text>
            </Column>
          </div>
        )}
      </AutoSizer>
      <CurrencySearchModal
        isOpen={modalOpen}
        onDismiss={hideModal}
        onCurrencySelect={hideModal}
        showCommonBases={false}
      />
    </Wrapper>
  )
}
