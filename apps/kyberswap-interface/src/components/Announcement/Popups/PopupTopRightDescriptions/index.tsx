import DescriptionCrossChain from 'components/Announcement/Popups/PopupTopRightDescriptions/DescriptionCrossChain'
import DescriptionPriceAlert from 'components/Announcement/Popups/PopupTopRightDescriptions/DescriptionPriceAlert'
import { SimplePopupProps } from 'components/Announcement/Popups/SimplePopup'
import { AnnouncementTemplate, PopupContentAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'

type SummaryMap = {
  [type in PrivateAnnouncementType]: (
    popup: AnnouncementTemplate,
    templateType: PrivateAnnouncementType,
  ) => SimplePopupProps
}

const MAP_DESCRIPTION = {
  [PrivateAnnouncementType.PRICE_ALERT]: DescriptionPriceAlert,
  [PrivateAnnouncementType.CROSS_CHAIN]: DescriptionCrossChain,
} as Partial<SummaryMap>

export default function getPopupTopRightDescriptionByType(
  content: PopupContentAnnouncement,
): SimplePopupProps | undefined {
  const { templateType, templateBody } = content
  return MAP_DESCRIPTION[templateType]?.(templateBody, templateType)
}
