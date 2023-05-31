import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { Announcement, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { BFF_API, NOTIFICATION_API, getAnnouncementsTemplateIds } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

type AnnouncementResponse<T extends PrivateAnnouncement | Announcement = Announcement> = {
  notifications: T[]
  numberOfUnread: number
  pagination: {
    totalItems: number
  }
}

const transformResponseAnnouncement = <T extends PrivateAnnouncement | Announcement = Announcement>(data: any) => {
  const { metaMessages, notifications, ...rest } = data.data ?? {}
  return {
    ...rest,
    notifications: (metaMessages ?? notifications ?? []).map((e: any) => ({
      ...e,
      templateBody: JSON.parse(e.templateBody ?? '{}') ?? {},
    })),
  } as AnnouncementResponse<T>
}

type Params = {
  page: number
  account?: string
  pageSize?: number
}

type ParamsPrivate = {
  page: number
  account: string
  templateIds?: string
  pageSize?: number
}

const excludedTemplateIds = getAnnouncementsTemplateIds('EXCLUDE')

export const ANNOUNCEMENT_TAGS = [
  RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID,
  RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN,
  RTK_QUERY_TAGS.GET_TOTAL_UNREAD_PRIVATE_ANN,
  RTK_QUERY_TAGS.GET_ALERTS_HISTORY,
]

const AnnouncementApi = createApi({
  reducerPath: 'announcementApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  tagTypes: ANNOUNCEMENT_TAGS,
  endpoints: builder => ({
    getPrivateAnnouncements: builder.query<AnnouncementResponse<PrivateAnnouncement>, ParamsPrivate>({
      query: ({ account, ...params }) => ({
        url: `/v1/notification/me`,
        params: { ...params, excludedTemplateIds },
      }),
      transformResponse: transformResponseAnnouncement,
      providesTags: [RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN],
    }),
    getPrivateAnnouncementsByIds: builder.query<AnnouncementResponse<PrivateAnnouncement>, ParamsPrivate>({
      query: ({ account, templateIds, ...params }) => ({
        url: `/v1/notification/me`,
        params: { ...params, templateIds },
      }),
      providesTags: [RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID],
      transformResponse: transformResponseAnnouncement,
    }),
    getTotalUnreadAnnouncements: builder.query<
      {
        numberOfUnread: number
        templateId: number
        templateType: PrivateAnnouncementType
      }[],
      { templateIds: string }
    >({
      query: ({ templateIds }) => ({
        url: `/v1/notification/me/number-unread`,
        params: { templateIds },
      }),
      transformResponse: (data: any) => data?.data?.result || [],
      providesTags: [RTK_QUERY_TAGS.GET_TOTAL_UNREAD_PRIVATE_ANN],
    }),
    ackPrivateAnnouncements: builder.mutation<
      AnnouncementResponse,
      { action: 'read' | 'clear-all' | 'read-all'; ids?: number[] }
    >({
      query: ({ action, ids }) => {
        const body: { excludedTemplateIds?: number[]; ids?: number[] } = { ids }
        if (action === 'read-all' || action === 'clear-all') {
          body.excludedTemplateIds = excludedTemplateIds.split(',').map(Number)
        }
        return {
          url: `/v1/notification/me/${action}`,
          method: 'put',
          body,
        }
      },
      invalidatesTags: [RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID, RTK_QUERY_TAGS.GET_TOTAL_UNREAD_PRIVATE_ANN],
    }),
    ackPrivateAnnouncementsByIds: builder.mutation<AnnouncementResponse, { templateIds?: string }>({
      query: ({ templateIds }) => {
        const body = {
          templateIds: templateIds?.split(',').map(Number),
          excludedTemplateIds: excludedTemplateIds.split(',').map(Number),
        }
        return {
          url: `/v1/notification/me/read-all`,
          method: 'put',
          body,
        }
      },
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN, RTK_QUERY_TAGS.GET_TOTAL_UNREAD_PRIVATE_ANN],
    }),
    clearAllPrivateAnnouncementById: builder.mutation<Response, { templateIds: string }>({
      query: ({ templateIds }) => ({
        url: `/v1/notification/me/clear-all`,
        body: {
          templateIds: templateIds.split(',').map(id => Number(id)),
        },
        method: 'PUT',
      }),
      invalidatesTags: [
        RTK_QUERY_TAGS.GET_ALL_PRIVATE_ANN,
        RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID,
        RTK_QUERY_TAGS.GET_TOTAL_UNREAD_PRIVATE_ANN,
      ],
    }),
    // price alert
    getListPriceAlertHistory: builder.query<
      AnnouncementResponse<PrivateAnnouncement>,
      {
        page: number
        pageSize?: number
      }
    >({
      query: params => ({
        url: `/v1/notification/me`,
        params: {
          ...params,
          templateIds: getAnnouncementsTemplateIds(PrivateAnnouncementType.PRICE_ALERT),
        },
      }),
      providesTags: [RTK_QUERY_TAGS.GET_ALERTS_HISTORY],
      transformResponse: transformResponseAnnouncement,
    }),
    clearSinglePriceAlertHistory: builder.mutation<Response, { id: number }>({
      query: ({ id }) => ({
        url: `/v1/notification/me/clear`,
        body: {
          ids: [id],
        },
        method: 'PUT',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS_HISTORY],
    }),
    clearAllPriceAlertHistory: builder.mutation<Response, void>({
      query: () => ({
        url: `/v1/notification/me/clear-all`,
        body: {
          templateIds: getAnnouncementsTemplateIds(PrivateAnnouncementType.PRICE_ALERT)
            .split(',')
            .map(id => Number(id)),
        },
        method: 'PUT',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS_HISTORY],
    }),
  }),
})

export const publicAnnouncementApi = createApi({
  reducerPath: 'announcementApiV2',
  baseQuery: fetchBaseQuery({ baseUrl: NOTIFICATION_API }),
  endpoints: builder => ({
    getAnnouncements: builder.query<AnnouncementResponse<Announcement>, Params>({
      query: params => ({
        url: `/v1/messages/announcements`,
        params,
      }),
      transformResponse: transformResponseAnnouncement,
    }),
  }),
})

export const { useGetAnnouncementsQuery, useLazyGetAnnouncementsQuery } = publicAnnouncementApi

export const {
  useLazyGetPrivateAnnouncementsQuery,
  useGetPrivateAnnouncementsQuery,
  useAckPrivateAnnouncementsMutation,
  useGetPrivateAnnouncementsByIdsQuery,
  useClearAllPrivateAnnouncementByIdMutation,
  useAckPrivateAnnouncementsByIdsMutation,
  useGetTotalUnreadAnnouncementsQuery,
  useClearSinglePriceAlertHistoryMutation,
  useClearAllPriceAlertHistoryMutation,
  useGetListPriceAlertHistoryQuery,
} = AnnouncementApi

export default AnnouncementApi
