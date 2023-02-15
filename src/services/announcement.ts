import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { Announcement, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { NOTIFICATION_API } from 'constants/env'

type Response = {
  notifications: PrivateAnnouncement[] | Announcement[]
  numberOfUnread: number
  pagination: {
    totalItems: number
  }
}

const transformResponse = (data: any) => {
  const { metaMessages, notifications, ...rest } = data.data ?? {}
  return {
    ...rest,
    notifications: (metaMessages ?? notifications ?? []).map((e: any) => ({
      ...e,
      templateBody: JSON.parse(e.templateBody ?? '{}'),
    })),
  } as Response
}

const transformResponseTest = (data: any) => {
  const notifications = Array.from({ length: 20 }, (x, y) => ({
    id: y,
    templateType: y % 2 ? PrivateAnnouncementType.BRIDGE : PrivateAnnouncementType.TRENDING_SOON_TOKEN,
    templateId: y,
    templateBody: {
      order: {
        id: 1663,
        chainId: '5',
        nonce: 7,
        makerAsset: '0x48f6d7dae56623dde5a0d56b283165cae1753d70',
        takerAsset: '0x63435cf71274ed12d9bfbc18440a4975764f74fd',
        makerAssetSymbol: 'ETH',
        takerAssetSymbol: 'DAI',
        makerAssetLogoURL:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        takerAssetLogoURL:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
        makerAssetDecimals: 18,
        takerAssetDecimals: 18,
        makingAmount: '1000000000000000',
        takingAmount: '1000000000000000',
        filledMakingAmount: '0',
        filledTakingAmount: '0',
        status: 'open',
        createdAt: 1676342280,
        expiredAt: 1676947073,
      },
      transaction: {
        id: 22,
        userAddress: '0x3f499def42cd6De917A2A8da02F71fC9517E650C',
        srcChainId: '1',
        dstChainId: '56',
        srcTxHash: '0xe2c5ee46016ad9b40d9aa5565cefed53fdb41ddd8b9086ee91fa9692e1b6ed4e',
        dstTxHash: '0x0b6da2d86c44912e66d9564801bd35fb05181078bfc56a4a47a26abfd3159556',
        srcTokenSymbol: 'KNC',
        dstTokenSymbol: 'KNC',
        srcAmount: '12.3456',
        dstAmount: '11.2326',
        status: 1,
        createdAt: 1672890601,
      },
      tokens: [
        {
          tokenSymbol: 'knc',
          price: '1.2',
          priceChange: '20',
          tokenLogoURL:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          tokenAddress: '0x3f499def42cd6De917A2A8da02F71fC9517E650C',
        },
        {
          tokenSymbol: 'knc',
          price: '1.2',
          priceChange: '20',
          tokenLogoURL:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          tokenAddress: '0x3f499def42cd6De917A2A8da02F71fC9517E650C',
        },
        {
          tokenSymbol: 'knc',
          price: '1.2',
          priceChange: '20',
          tokenLogoURL:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          tokenAddress: '0x3f499def42cd6De917A2A8da02F71fC9517E650C',
        },
      ],
    } as any,
  }))
  return { notifications, pagination: { totalItems: notifications.length + 12 }, numberOfUnread: 1 } as Response
}

type Params = {
  page: number
  account?: string
}
const AnnouncementApi = createApi({
  reducerPath: 'announcementApi',
  baseQuery: fetchBaseQuery({ baseUrl: NOTIFICATION_API }),
  endpoints: builder => ({
    getAnnouncements: builder.query<Response, Params>({
      query: params => ({
        url: `/v1/messages/announcements`,
        params,
      }),
      transformResponse,
    }),
    getPrivateAnnouncements: builder.query<Response, Params>({
      query: ({ account, ...params }) => ({
        url: `/v1/users/${account}/notifications`,
        params: { ...params, excludedTemplateIds: '2,29' }, // todo danh config env
      }),
      transformResponse,
    }),
    ackPrivateAnnouncements: builder.mutation<
      Response,
      { account: string; action: 'read' | 'clear-all'; ids?: number[] }
    >({
      query: ({ account, action, ids }) => ({
        url: `/v1/users/${account}/notifications/${action}`,
        method: 'put',
        body: { ids },
      }),
    }),
  }),
})

export default AnnouncementApi
