const cronosTokens = [
  {
    chainId: 25,
    address: "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",
    _scan:
      "https://cronoscan.com/token/0xc21223249CA28397B4B6541dfFaEcC539BfF0c59",
    symbol: "USDC",
    name: "USDC",
    decimals: 6,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
  },
  {
    chainId: 25,
    address: "0x66e428c3f67a68878562e79A0234c1F83c208770",
    _scan:
      "https://cronoscan.com/token/0x66e428c3f67a68878562e79A0234c1F83c208770",
    symbol: "USDT",
    name: "USDT",
    decimals: 6,
    logoURI: "https://coin.top/production/logo/usdtlogo.png",
  },
  {
    chainId: 25,
    address: "0xF2001B145b43032AAF5Ee2884e456CCd805F677D",
    _scan:
      "https://cronoscan.com/token/0xF2001B145b43032AAF5Ee2884e456CCd805F677D",
    symbol: "DAI",
    name: "DAI",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png",
  },
  {
    chainId: 25,
    address: "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23",
    _scan:
      "https://cronoscan.com/token/0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23",
    symbol: "WCRO",
    name: "Wrapped CRO",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/14532.png",
  },
  {
    chainId: 25,
    address: "0xe6801928061CDbE32AC5AD0634427E140EFd05F9",
    _scan:
      "https://cronoscan.com/token/0xe6801928061CDbE32AC5AD0634427E140EFd05F9",
    symbol: "BIFI",
    name: "Beefy.finance",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/12704/small/token.png",
  },
  {
    chainId: 25,
    address: "0xe44Fd7fCb2b1581822D0c862B68222998a0c299a",
    _scan:
      "https://cronoscan.com/token/0xe44Fd7fCb2b1581822D0c862B68222998a0c299a",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  },
  {
    chainId: 25,
    address: "0xbED48612BC69fA1CaB67052b42a95FB30C1bcFee",
    _scan:
      "https://cronoscan.com/token/0xbED48612BC69fA1CaB67052b42a95FB30C1bcFee",
    symbol: "SHIB",
    name: "Shiba Inu",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
  },
  {
    chainId: 25,
    address: "0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03",
    _scan:
      "https://cronoscan.com/token/0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03",
    symbol: "VVS",
    name: "VVS Token",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/20210/small/8glAYOTM_400x400.jpg",
  },
  {
    chainId: 25,
    address: "0x062E66477Faf219F25D27dCED647BF57C3107d52",
    _scan:
      "https://cronoscan.com/token/0x062E66477Faf219F25D27dCED647BF57C3107d52",
    symbol: "WBTC",
    name: "Wrapped BTC",
    decimals: 8,
    logoURI:
      "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  },
  {
    chainId: 25,
    address: "0xadbd1231fb360047525BEdF962581F3eee7b49fe",
    _scan:
      "https://cronoscan.com/token/0xadbd1231fb360047525BEdF962581F3eee7b49fe",
    symbol: "CRONA",
    name: "CronaSwap Token",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/14625.png",
  },
  {
    chainId: 25,
    address: "0x97749c9B61F878a880DfE312d2594AE07AEd7656",
    _scan:
      "https://cronoscan.com/token/0x97749c9B61F878a880DfE312d2594AE07AEd7656",
    symbol: "MMF",
    name: "Mad Meerkat Finance",
    decimals: 18,
    logoURI:
      "https://mm.finance//images/tokens/0x97749c9B61F878a880DfE312d2594AE07AEd7656.svg",
  },
  {
    chainId: 25,
    address: "0xB888d8Dd1733d72681b30c00ee76BDE93ae7aa93",
    _scan:
      "https://cronoscan.com/token/0xB888d8Dd1733d72681b30c00ee76BDE93ae7aa93",
    symbol: "ATOM",
    name: "ATOM",
    decimals: 6,
    logoURI:
      "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
  },
  {
    chainId: 25,
    address: "0xCbDE0E17d14F49e10a10302a32d17AE88a7Ecb8B",
    _scan:
      "https://cronoscan.com/token/0xCbDE0E17d14F49e10a10302a32d17AE88a7Ecb8B",
    symbol: "CRYSTL",
    name: "Crystal Token",
    decimals: 18,
    logoURI: "https://www.crystl.finance/images/landing/shareholder.svg",
  },
  {
    chainId: 25,
    address: "0x83b2AC8642aE46FC2823Bc959fFEB3c1742c48B5",
    _scan:
      "https://cronoscan.com/token/0x83b2AC8642aE46FC2823Bc959fFEB3c1742c48B5",
    symbol: "DARK",
    name: "DarkCrypto",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/DARK.svg",
  },
  {
    chainId: 25,
    address: "0x10C9284E6094b71D3CE4E38B8bFfc668199da677",
    _scan:
      "https://cronoscan.com/token/0x10C9284E6094b71D3CE4E38B8bFfc668199da677",
    symbol: "MIMAS",
    name: "Mimas Finance",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/MIMAS.png",
  },
  {
    chainId: 25,
    address: "0x2Ae35c8E3D4bD57e8898FF7cd2bBff87166EF8cb",
    _scan:
      "https://cronoscan.com/token/0x2Ae35c8E3D4bD57e8898FF7cd2bBff87166EF8cb",
    decimals: 18,
    name: "MAI",
    symbol: "MAI",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/MAI.svg",
  },
];

export default cronosTokens;
