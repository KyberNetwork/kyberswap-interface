import { Trans } from '@lingui/macro'
import { Info } from 'react-feather'
import { useMedia } from 'react-use'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useLogin from 'hooks/useLogin'
import { useSessionInfo } from 'state/authen/hooks'
import { useSignedAccountInfo } from 'state/profile/hooks'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

const DOC_URL = 'https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/profiles'
const WarningSignMessage = () => {
  const { signIn } = useLogin()
  const { pendingAuthentication } = useSessionInfo()
  const { isSigInGuest } = useSignedAccountInfo()
  const { account } = useActiveWeb3React()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const btnWidth = upToMedium ? '45%' : '110px'
  if (pendingAuthentication || !isSigInGuest) return null
  return (
    <div className="flex items-center gap-5 rounded-3xl bg-subText-20 px-3.5 py-2 max-md:flex-col max-md:gap-2.5 max-md:px-3.5 max-md:py-3">
      <Row style={{ gap: '12px' }}>
        {!upToMedium && <Info className="text-subText" size={18} style={{ minWidth: '18px' }} />}
        <span className="text-xs leading-4">
          <Trans>
            You are not signed in with this wallet address. Click Sign-In to link your wallet to a profile. This will
            allow us to offer you a better experience.
            {!upToMedium ? (
              <>
                {' '}
                Read more <ExternalLink href={DOC_URL}>here ↗</ExternalLink>
              </>
            ) : (
              ''
            )}
          </Trans>
        </span>
      </Row>
      <Row justify="space-between" width={upToMedium ? '100%' : 'fit-content'}>
        {upToMedium && (
          <ButtonOutlined width={btnWidth} height={'30px'} fontSize={'14px'} onClick={() => window.open(DOC_URL)}>
            <Trans>Read More</Trans>
          </ButtonOutlined>
        )}
        <ButtonPrimary width={btnWidth} height={'30px'} fontSize={'14px'} onClick={() => signIn({ account })}>
          <Trans>Sign-in</Trans>
        </ButtonPrimary>
      </Row>
    </div>
  )
}
export default WarningSignMessage
