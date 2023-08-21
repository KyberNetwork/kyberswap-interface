export const UNWHITELIST_SYMBOL_TOKENS = ['KNNC', 'KCCN']
export const NORESULTS_TEXT = "No results found."
export const NOTOKENS_TEXT = "Select a token"
export const DEFAULT_NETWORK = "Ethereum"
export const NETWORK = Cypress.env('NETWORK')
export const DEFAULT_URL = `swap/${NETWORK}`.toLowerCase()


export enum TAG {
    smoke = 'smoke',
    regression = 'regression',
}

export const TOKEN_SYMBOLS = {
    'Ethereum': ['BAND', 'DAI', 'USDT', 'USDC'],
    'Arbitrum': ['ANGLE', 'DAI', 'USDT', 'USDC.e'],
    'Optimism': ['BOB', 'DAI', 'USDT', 'USDC'],
    'Avalanche': ['AAVE.e', 'sAVAX', 'USDT.e', 'USDC.e'],
    'BNB': ['RICE', 'DAI', 'USDT', 'USDC']
}

export const UNWHITELIST_TOKENS = {
    "Ethereum":
        [
            {
                symbol: 'SCOOBY',
                address: '0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F',
            },
            {
                symbol: 'UNIBOT',
                address: '0x25127685dc35d4dc96c7feac7370749d004c5040',
            },
            {
                symbol: 'BGB',
                address: '0x19de6b897ed14a376dda0fe53a5420d2ac828a28',
            },
        ],
    "Arbitrum": [
        {
            symbol: 'OHM',
            address: '0xf0cb2dc0db5e6c66b9a70ac27b06b878da017028',
        },
        {
            symbol: 'GBL',
            address: '0xe9a264e9d45ff72e1b4a85d77643cdbd4c950207',
        },
        {
            symbol: 'Y2K',
            address: '0x65c936f008bc34fe819bce9fa5afd9dc2d49977f',
        },
    ],
    "Optimism":
        [
            {
                symbol: 'CHI',
                address: '0xca0e54b636db823847b29f506bffee743f57729d',
            },
            {
                symbol: 'ACX',
                address: '0xFf733b2A3557a7ed6697007ab5D11B79FdD1b76B',
            },
            {
                symbol: 'PSP',
                address: '0xd3594e879b358f430e20f82bea61e83562d49d48',
            },
        ],
    "Avalanche":
        [
            {
                symbol: 'RADIO',
                address: '0x02bfd11499847003de5f0f5aa081c43854d48815',
            },
            {
                symbol: 'EUROC',
                address: '0xc891eb4cbdeff6e073e859e987815ed1505c2acd',
            },
            {
                symbol: 'MELD',
                address: '0x333000333b26ee30214b4af6419d9ab07a450400',
            },
        ],
    "BNB":
        [
            {
                symbol: 'TUSD',
                address: '0x40af3827f39d0eacbf4a168f8d4ee67c121d11c9',
            },
            {
                symbol: 'ARA',
                address: '0x5542958fa9bd89c96cb86d1a6cb7a3e644a3d46e',
            },
            {
                symbol: 'FLASH',
                address: '0xc3111096b3b46873393055dea14036ea603cfa95',
            }
        ],
}