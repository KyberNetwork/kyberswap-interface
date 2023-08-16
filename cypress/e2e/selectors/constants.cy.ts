export const unListedToken = ['KNNC', 'KCCN']
export const noResultsText = "No results found."
export const noTokensText = "Select a token"

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

export const UNWHITE_LIST_TOKENS = {
    "Ethereum":
        [
            {
                name: 'SCOOBY',
                address: '0xAd497eE6a70aCcC3Cbb5eB874e60d87593B86F2F',
            },
            {
                name: 'UNIBOT',
                address: '0x25127685dc35d4dc96c7feac7370749d004c5040',
            },
            {
                name: 'BGB',
                address: '0x19de6b897ed14a376dda0fe53a5420d2ac828a28',
            },
        ],
    "Arbitrum": [
        {
            name: 'OHM',
            address: '0xf0cb2dc0db5e6c66b9a70ac27b06b878da017028',
        },
        {
            name: 'GBL',
            address: '0xe9a264e9d45ff72e1b4a85d77643cdbd4c950207',
        },
        {
            name: 'Y2K',
            address: '0x65c936f008bc34fe819bce9fa5afd9dc2d49977f',
        },
    ],
    "Optimism":
        [
            {
                name: 'CHI',
                address: '0xca0e54b636db823847b29f506bffee743f57729d',
            },
            {
                name: 'ACX',
                address: '0xFf733b2A3557a7ed6697007ab5D11B79FdD1b76B',
            },
            {
                name: 'PSP',
                address: '0xd3594e879b358f430e20f82bea61e83562d49d48',
            },
        ],
    "Avalanche":
        [
            {
                name: 'RADIO',
                address: '0x02bfd11499847003de5f0f5aa081c43854d48815',
            },
            {
                name: 'EUROC',
                address: '0xc891eb4cbdeff6e073e859e987815ed1505c2acd',
            },
            {
                name: 'MELD',
                address: '0x333000333b26ee30214b4af6419d9ab07a450400',
            },
        ],
    "BNB":
        [
            {
                name: 'TUSD',
                address: '0x40af3827f39d0eacbf4a168f8d4ee67c121d11c9',
            },
            {
                name: 'ARA',
                address: '0x5542958fa9bd89c96cb86d1a6cb7a3e644a3d46e',
            },
            {
                name: 'FLASH',
                address: '0xc3111096b3b46873393055dea14036ea603cfa95',
            }
        ],
}