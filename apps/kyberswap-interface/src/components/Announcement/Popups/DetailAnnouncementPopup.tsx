import { t } from '@lingui/macro'
import { ChevronLeft, ChevronRight, X } from 'react-feather'
import { useMedia } from 'react-use'

import NotificationImage from 'assets/images/notification_default.png'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { Z_INDEXS } from 'constants/styles'
import { useDetailAnnouncement } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { useNavigateToUrl } from 'utils/redirect'
import { escapeScriptHtml } from 'utils/string'

const PAGINATION_BTN_CLASS =
  'absolute top-0 bottom-0 my-auto hidden h-7 w-7 cursor-pointer select-none items-center justify-center rounded-[30px] bg-border/70 text-text opacity-70 group-hover:flex max-md:flex'

const CLOSE_BTN_CLASS =
  'absolute right-3 top-3 hidden min-w-[24px] cursor-pointer group-hover:flex max-md:flex max-sm:right-[-10px] max-sm:top-[-10px]'

const CTA_BUTTON_CLASS = 'h-9 w-fit min-w-[220px] max-w-full max-sm:min-w-[100px]'

export const formatCtaName = (ctaName: string, ctaUrl: string) => {
  const formatName = ctaName.replace('{{.ctaName}}', '')
  if (!ctaUrl) return formatName || t`Close`
  return formatName || t`Detail`
}

export default function DetailAnnouncementPopup({
  fetchMore,
}: {
  fetchMore: () => Promise<{ hasMore: boolean; announcements: AnnouncementTemplatePopup[] } | undefined>
}) {
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const [{ selectedIndex, announcements = [], hasMore }, setAnnouncementDetail] = useDetailAnnouncement()

  const navigate = useNavigateToUrl()

  const onDismiss = () => setAnnouncementDetail({ selectedIndex: null, announcements: [], hasMore: false })
  const onNext = async () => {
    const nextIndex = (selectedIndex ?? 0) + 1
    if (nextIndex < announcements.length) {
      setAnnouncementDetail({ selectedIndex: nextIndex })
      return
    }
    if (hasMore) {
      const data = await fetchMore()
      if (data) setAnnouncementDetail({ ...data, selectedIndex: nextIndex })
    }
  }
  const onBack = () => setAnnouncementDetail({ selectedIndex: Math.max(0, (selectedIndex ?? 0) - 1) })

  if (selectedIndex === null || !announcements[selectedIndex]) return null

  const { name, thumbnailImageURL, content, ctaURL, ctaName = '', ctas: rawCtas } = announcements[selectedIndex]
  const ctas = (rawCtas?.length ? rawCtas : [{ url: ctaURL, name: ctaName }]).map(e => ({
    ...e,
    name: formatCtaName(e.name, e.url),
  }))

  const onClickCta = (ctaUrl: string) => {
    onDismiss()
    navigate(ctaUrl)
  }

  return (
    <Modal
      enableSwipeGesture={false}
      isOpen={true}
      maxWidth={isMobile ? undefined : '480px'}
      onDismiss={onDismiss}
      zindex={Z_INDEXS.MODAL}
    >
      <div className="group relative flex h-[580px] w-full flex-col gap-6 p-6 max-md:gap-4 max-md:p-5 max-md:pb-4">
        <div className="relative">
          <img
            src={thumbnailImageURL || NotificationImage}
            className="m-auto max-h-[270px] w-full rounded-[20px] object-contain"
          />
          <X onClick={onDismiss} className={cn(CLOSE_BTN_CLASS, 'text-subText')} />
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden max-md:gap-5 [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-subText [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1 [&_a:focus-visible]:outline-none">
          <div className="break-words text-xl font-medium leading-6">{name}</div>
          <div
            dangerouslySetInnerHTML={{
              __html: escapeScriptHtml(content),
            }}
            className="break-words text-sm leading-5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
          />
        </div>
        <Row className="justify-center gap-6 max-sm:gap-3">
          {ctas.length > 0 &&
            ctas.map(item => (
              <CtaButton
                key={item.url}
                className={CTA_BUTTON_CLASS}
                data={item}
                color={!item.url ? 'outline' : 'primary'}
                onClick={() => onClickCta(item.url)}
              />
            ))}
        </Row>
        {announcements.length > 1 && (
          <>
            <div onClick={onBack} className={PAGINATION_BTN_CLASS} style={{ left: 4 }}>
              <ChevronLeft size={18} />
            </div>
            <div onClick={onNext} className={PAGINATION_BTN_CLASS} style={{ right: 4 }}>
              <ChevronRight size={18} />
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
