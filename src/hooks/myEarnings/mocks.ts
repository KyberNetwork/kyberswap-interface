import { EarningStatsOverTime, EarningsBreakdown } from 'types/myEarnings'

export const myTotalEarningsMock: EarningsBreakdown = {
  totalValue: 189_123_456.123_456,
  breakdowns: [
    {
      title: 'MATIC',
      value: '$121K',
      percent: 25,
    },
    {
      title: 'DAI',
      value: '$81K',
      percent: 15,
    },
    {
      title: 'USDT',
      value: '$8K',
      percent: 30,
    },
    {
      title: 'KNC',
      value: '$9K',
      percent: 10,
    },
    {
      title: 'BNB',
      value: '$18M',
      percent: 20,
    },
  ],
}

export const earningsOverTimeMock: EarningStatsOverTime = {
  totalValue: 123_456.789,
  ticks: Array(7)
    .fill(0)
    .map((_, index) => index + 1)
    .map(n => {
      const pool = 1000 * (n + 1)
      const farm = 2400 * (n + 1)
      const tokens = [
        {
          logoUrl: 'https://storage.googleapis.com/ks-setting-1d682dca/8f9b9215-82db-4bf9-9fa4-98ae1adde8c9.png',
          amount: 0.37757275,
        },
        {
          logoUrl:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          amount: 0.1232257275,
        },
        {
          logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
          amount: 3.2312357275,
        },
        {
          logoUrl: 'https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/MAI.svg',
          amount: 0.37757275,
        },
        {
          logoUrl: 'https://storage.googleapis.com/ks-setting-1d682dca/8f9b9215-82db-4bf9-9fa4-98ae1adde8c9.png',
          amount: 0.37757275,
        },
        {
          logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/128x128/18688.png',
          amount: 12123.37757275,
        },
      ]

      return {
        date: `Nov 1${n}`,
        pool: {
          totalValue: pool,
          tokens,
        },
        farm: {
          totalValue: farm,
          tokens,
        },
        total: pool + farm,
      }
    }),
}
