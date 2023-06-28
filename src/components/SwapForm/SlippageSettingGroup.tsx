import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Shield } from 'components/Icons'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

import AddMEVProtectionModal from './AddMEVProtectionModal'

const PriceAlertButton = styled.div`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
`

export default function SlippageSettingGroup({
  isStablePairSwap,
  isWrapOrUnwrap,
}: {
  isStablePairSwap: boolean
  isWrapOrUnwrap: boolean
}) {
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const [showMevModal, setShowMevModal] = useState(false)
  const addMevProtectionHandler = useCallback(() => {
    setShowMevModal(true)
  }, [])

  const rightButton =
    chainId === ChainId.MAINNET ? (
      <MouseoverTooltip
        text={
          <Trans>
            MEV Protection will protect you from front-running and sandwich attacks on Ethereum. Learn more{' '}
            <ExternalLink href="https://docs.kyberswap.com/getting-started/quickstart/faq#how-to-change-rpc-in-metamask">
              here ↗
            </ExternalLink>
          </Trans>
        }
      >
        <PriceAlertButton onClick={addMevProtectionHandler}>
          <Shield size={14} color={theme.subText} />
          {upToXXSmall ? null : (
            <Text color={theme.subText} style={{ whiteSpace: 'nowrap' }}>
              <Trans>Add MEV Protection</Trans>
            </Text>
          )}
        </PriceAlertButton>
      </MouseoverTooltip>
    ) : null

  return (
    <Flex alignItems="flex-start" fontSize={12} color={theme.subText} justifyContent="space-between">
      {isWrapOrUnwrap ? (
        <>
          <div />
          {rightButton}
        </>
      ) : (
        <SlippageSetting isStablePairSwap={isStablePairSwap} rightComponent={rightButton} />
      )}
      <AddMEVProtectionModal isOpen={showMevModal} onClose={() => setShowMevModal(false)} />
    </Flex>
  )
}
