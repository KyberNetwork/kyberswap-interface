import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { Announcement, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { NOTIFICATION_API, getAnnouncementTemplateType } from 'constants/env'

type NotificationResponse<T extends PrivateAnnouncement | Announcement = Announcement> = {
  notifications: T[]
  numberOfUnread: number
  pagination: {
    totalItems: number
  }
}

const transformResponseAnnouncement = <T extends PrivateAnnouncement | Announcement = Announcement>(data: any) => {
  const { metaMessages, notifications, ...rest } = data.data || {}
  return {
    ...rest,
    notifications: (metaMessages ?? notifications ?? []).map((event: PrivateAnnouncement<any>) => {
      let templateBody = {}
      try {
        const parsed = event.templateBody
          .replace(/\{\{\.\w+\}\}/, 'unknown')
          .replace(/"\{/g, '{')
          .replace(/\}"/g, '}')
        templateBody = JSON.parse(parsed)
      } catch (error) {}
      const templateType = getAnnouncementTemplateType(event.templateId)
      if (templateType === PrivateAnnouncementType.POSITION_STATUS) {
        if (templateBody && !('position' in templateBody)) {
          templateBody = { position: templateBody }
        }
      }
      return {
        ...event,
        templateType,
        templateBody,
      }
    }),
  } as NotificationResponse<T>
}

type Params = {
  account: string
  templateIds?: string
  page?: number
  pageSize?: number
}

const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: NOTIFICATION_API,
  }),
  endpoints: builder => ({
    getNotifications: builder.query<NotificationResponse<PrivateAnnouncement>, Params>({
      query: ({ account, ...params }) => ({
        url: `/v1/users/${account}/notifications`,
        params,
      }),
      transformResponse: transformResponseAnnouncement,
    }),
    getNumberUnreadNotifications: builder.query<
      {
        numberOfUnread: number
        templateId: number
        templateType: string
      }[],
      { account: string; templateIds?: string }
    >({
      query: ({ account, templateIds }) => ({
        url: `/v1/users/${account}/number-unread`,
        params: { templateIds },
      }),
      transformResponse: (data: any) => data?.data?.result || [],
    }),
    readNotifications: builder.mutation<
      NotificationResponse,
      { account: string; ids?: number[]; templateIds?: string }
    >({
      query: ({ account, ids, templateIds }) => ({
        url: `/v1/users/${account}/notifications/read`,
        method: 'PUT',
        body: {
          ids,
          templateIds: templateIds?.split(',').map(Number),
        },
      }),
      transformResponse: transformResponseAnnouncement,
    }),
    readAllNotifications: builder.mutation<NotificationResponse, { account: string; templateIds?: string }>({
      query: ({ account, templateIds }) => ({
        url: `/v1/users/${account}/notifications/read-all`,
        method: 'PUT',
        body: {
          templateIds: templateIds?.split(',').map(Number),
        },
      }),
      transformResponse: transformResponseAnnouncement,
    }),
    clearNotifications: builder.mutation<
      NotificationResponse,
      { account: string; ids?: number[]; templateIds?: string }
    >({
      query: ({ account, ids, templateIds }) => ({
        url: `/v1/users/${account}/notifications/clear`,
        method: 'PUT',
        body: {
          ids,
          templateIds: templateIds?.split(',').map(Number),
        },
      }),
      transformResponse: transformResponseAnnouncement,
    }),
    clearAllNotifications: builder.mutation<NotificationResponse, { account: string; templateIds?: string }>({
      query: ({ account, templateIds }) => ({
        url: `/v1/users/${account}/notifications/clear-all`,
        method: 'PUT',
        body: {
          templateIds: templateIds?.split(',').map(Number),
        },
      }),
      transformResponse: transformResponseAnnouncement,
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetNumberUnreadNotificationsQuery,
  useReadNotificationsMutation,
  useReadAllNotificationsMutation,
  useClearNotificationsMutation,
  useClearAllNotificationsMutation,
} = notificationApi

export default notificationApi
