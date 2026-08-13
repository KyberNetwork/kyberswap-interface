import { Trans } from '@lingui/macro'

import { FooterSocialLink } from 'components/Footer/Footer'
import { Center, HStack } from 'components/Stack'
import VerticalDivider from 'components/VerticalDivider'
import { ExternalLink, StyledInternalLink } from 'theme'

const AboutFooter = () => (
  <Center className="w-full shrink-0 bg-background [filter:drop-shadow(0px_-4px_16px_rgba(0,0,0,0.04))]">
    <HStack className="w-full max-w-[1248px] items-center justify-between gap-6 p-6 text-sm max-sm:flex-col max-sm:justify-center [&_a]:text-subText">
      <HStack className="flex-wrap justify-center gap-3">
        <ExternalLink href="https://docs.kyberswap.com">
          <Trans>Docs</Trans>
        </ExternalLink>
        <VerticalDivider />
        <ExternalLink href="https://github.com/KyberNetwork">
          <Trans>Github</Trans>
        </ExternalLink>
        <VerticalDivider />
        <ExternalLink href="https://kyber.org">KyberDAO</ExternalLink>
        <VerticalDivider />
        <ExternalLink href="https://gov.kyber.org">
          <Trans>Forum</Trans>
        </ExternalLink>
        <div className="min-[500px]:hidden" />
        <VerticalDivider className="hidden min-[500px]:block" />
        <ExternalLink href="https://kyber.network">Kyber Network</ExternalLink>
        <VerticalDivider />
        <StyledInternalLink to="/about/knc">KNC</StyledInternalLink>
      </HStack>
      <FooterSocialLink />
    </HStack>
  </Center>
)

export default AboutFooter
