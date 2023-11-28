import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { SHARE_TYPE } from 'services/social'

import ShareImageModal from 'components/ShareModal/ShareImageModal'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { getProxyTokenLogo } from 'utils/tokenInfo'

import { NETWORK_IMAGE_URL } from '../constants'
import useKyberAIAssetOverview from '../hooks/useKyberAIAssetOverview'

export default function KyberAIShareModal(props: {
  title?: string
  content?: (mobileMode?: boolean) => ReactNode
  isOpen: boolean
  onClose?: () => void
  onShareClick?: (network: string) => void
}) {
  const theme = useTheme()
  const { chain } = useParams()
  const { data: tokenOverview } = useKyberAIAssetOverview()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const TokenInfo = () => (
    <>
      {tokenOverview && (
        <>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <img
                src={getProxyTokenLogo(tokenOverview.logo)}
                width="36px"
                height="36px"
                style={{ background: 'white', display: 'block' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                borderRadius: '50%',
                border: `1px solid ${theme.background}`,
                background: theme.tableHeader,
              }}
            >
              <img
                src={NETWORK_IMAGE_URL[chain || 'ethereum']}
                alt="eth"
                width="16px"
                height="16px"
                style={{ display: 'block' }}
              />
            </div>
          </div>
          <Text
            fontSize={24}
            color={theme.text}
            fontWeight={500}
            style={{
              whiteSpace: above768 ? 'nowrap' : 'unset',
            }}
          >
            {tokenOverview?.name} ({tokenOverview?.symbol?.toUpperCase()})
          </Text>
        </>
      )}
    </>
  )

  return (
    <ShareImageModal
      {...props}
      shareType={SHARE_TYPE.KYBER_AI}
      titleLogo={<TokenInfo />}
      imageName="kyberAI_share_image.png"
      kyberswapLogoTitle={
        <Trans>
          <Text as="span" color={theme.text}>
            KyberAI |
          </Text>{' '}
          <Text color={theme.subText} as={'span'}>
            Ape Smart
          </Text>
        </Trans>
      }
    />
  )
}
