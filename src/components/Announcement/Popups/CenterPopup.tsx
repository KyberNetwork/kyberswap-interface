import { t } from '@lingui/macro'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import CtaButton from 'components/Announcement/Popups/CtaButton'
import { AnnouncementTemplatePopup, PopupContentAnnouncement } from 'components/Announcement/type'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { PopupItemType } from 'state/application/reducer'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'

const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 20px;
    padding: 20px;
  `}
`
const Title = styled.div`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
`

const ButtonWrapper = styled(Row)`
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 12px;
  `}
`

const StyledLink = styled(ExternalLink)`
  &:hover {
    text-decoration: none;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 200px;
    min-width: 100px;
    max-width: 45%;
  `}
`

const StyledCtaButton = styled(CtaButton)`
  width: 220px;
  height: 36px;
  max-width: 100%;
`
export default function CenterPopup({ data, clearAll }: { data: PopupItemType; clearAll: () => void }) {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { templateBody = {} } = data.content as PopupContentAnnouncement
  const { name = t`Important Announcement!`, content, ctas = [] } = templateBody as AnnouncementTemplatePopup

  return (
    <Modal isOpen={true} maxWidth={isMobile ? undefined : '800px'}>
      <Wrapper>
        <RowBetween align="flex-end">
          <Title>{name}</Title>
          <X cursor={'pointer'} color={theme.subText} onClick={clearAll} />
        </RowBetween>
        <div style={{ fontSize: 14, lineHeight: '20px' }} dangerouslySetInnerHTML={{ __html: content }} />
        <ButtonWrapper justify="center">
          {ctas.map(item => (
            <StyledLink href={item.url} key={item.url}>
              <StyledCtaButton data={item} color="primary" onClick={clearAll} />
            </StyledLink>
          ))}
        </ButtonWrapper>
      </Wrapper>
    </Modal>
  )
}
