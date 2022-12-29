const fantomTokens = [
  {
    name: "Aave",
    symbol: "AAVE",
    address: "0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B",
    _scan:
      "https://ftmscan.com/token/0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B",
    chainId: 250,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png",
  },
  {
    name: "Badger",
    symbol: "BADGER",
    address: "0x753fbc5800a8C8e3Fb6DC6415810d627A387Dfc9",
    _scan:
      "https://ftmscan.com/token/0x753fbc5800a8C8e3Fb6DC6415810d627A387Dfc9",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/13287/large/badger_dao_logo.jpg",
  },
  {
    name: "Band Protocol",
    symbol: "BAND",
    address: "0x46E7628E8b4350b2716ab470eE0bA1fa9e76c6C5",
    _scan:
      "https://ftmscan.com/token/0x46E7628E8b4350b2716ab470eE0bA1fa9e76c6C5",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/9545/large/band-protocol.png",
  },
  {
    name: "SpookySwap",
    symbol: "BOO",
    address: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
    _scan:
      "https://ftmscan.com/token/0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/9608.png",
  },
  {
    name: "Cover Protocol",
    symbol: "COVER",
    address: "0xB01E8419d842beebf1b70A7b5f7142abbaf7159D",
    _scan:
      "https://ftmscan.com/token/0xB01E8419d842beebf1b70A7b5f7142abbaf7159D",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/13563/large/1_eWBbDaqpxXqt7WYPSP4qSw.jpeg",
  },
  {
    name: "Cream",
    symbol: "CREAM",
    address: "0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6",
    _scan:
      "https://ftmscan.com/token/0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6",
    chainId: 250,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/11976/large/Cream.png",
  },
  {
    name: "Curve DAO",
    symbol: "CRV",
    address: "0x1E4F97b9f9F913c46F1632781732927B9019C68b",
    _scan:
      "https://ftmscan.com/token/0x1E4F97b9f9F913c46F1632781732927B9019C68b",
    chainId: 250,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/12124/large/Curve.png",
  },
  {
    name: "Dai Stablecoin",
    symbol: "DAI",
    address: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
    _scan:
      "https://ftmscan.com/token/0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png",
  },
  {
    name: "Frapped USDT",
    symbol: "fUSDT",
    address: "0x049d68029688eAbF473097a2fC38ef61633A3C7A",
    _scan:
      "https://ftmscan.com/token/0x049d68029688eAbF473097a2fC38ef61633A3C7A",
    chainId: 250,
    decimals: 6,
    logoURI:
      "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
  },
  {
    name: "Graviton",
    symbol: "GTON",
    address: "0xC1Be9a4D5D45BeeACAE296a7BD5fADBfc14602C4",
    _scan:
      "https://ftmscan.com/token/0xC1Be9a4D5D45BeeACAE296a7BD5fADBfc14602C4",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/10006.png",
  },
  {
    name: "IceToken",
    symbol: "ICE",
    address: "0xf16e81dce15B08F326220742020379B855B87DF9",
    _scan:
      "https://ftmscan.com/token/0xf16e81dce15B08F326220742020379B855B87DF9",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/9073.png",
  },
  {
    name: "ChainLink",
    symbol: "LINK",
    address: "0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8",
    _scan:
      "https://ftmscan.com/token/0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
  },
  {
    name: "Synthetix Network",
    symbol: "SNX",
    address: "0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc",
    _scan:
      "https://ftmscan.com/token/0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/SNX.svg",
  },
  {
    name: "Sushi",
    symbol: "SUSHI",
    address: "0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC",
    _scan:
      "https://ftmscan.com/token/0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/SUSHI.svg",
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
    _scan:
      "https://ftmscan.com/token/0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
    chainId: 250,
    decimals: 6,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
  },
  {
    name: "Wrapped Bitcoin",
    symbol: "wBTC",
    address: "0x321162Cd933E2Be498Cd2267a90534A804051b11",
    _scan:
      "https://ftmscan.com/token/0x321162Cd933E2Be498Cd2267a90534A804051b11",
    chainId: 250,
    decimals: 8,
    logoURI:
      "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
  },
  {
    name: "Wrapped Ether",
    symbol: "wETH",
    address: "0x74b23882a30290451A17c44f4F05243b6b58C76d",
    _scan:
      "https://ftmscan.com/token/0x74b23882a30290451A17c44f4F05243b6b58C76d",
    chainId: 250,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  {
    name: "Wrapped FTM",
    symbol: "wFTM",
    address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
    _scan:
      "https://ftmscan.com/token/0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/10240.png",
  },
  {
    name: "yearn.finance",
    symbol: "YFI",
    address: "0x29b0Da86e484E1C0029B56e817912d778aC0EC69",
    _scan:
      "https://ftmscan.com/token/0x29b0Da86e484E1C0029B56e817912d778aC0EC69",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png",
  },
  {
    name: "ZooCoin",
    symbol: "ZOO",
    address: "0x09e145A1D53c0045F41aEEf25D8ff982ae74dD56",
    _scan:
      "https://ftmscan.com/token/0x09e145A1D53c0045F41aEEf25D8ff982ae74dD56",
    chainId: 250,
    decimals: 0,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/9007.png",
  },
  {
    name: "Frax Share",
    symbol: "FXS",
    address: "0x82F8Cb20c14F134fe6Ebf7aC3B903B2117aAfa62",
    _scan:
      "https://ftmscan.com/token/0x82F8Cb20c14F134fe6Ebf7aC3B903B2117aAfa62",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/FXS.svg",
  },
  {
    name: "MMToken",
    symbol: "MM",
    address: "0xbFaf328Fe059c53D936876141f38089df0D1503D",
    _scan:
      "https://ftmscan.com/token/0xbFaf328Fe059c53D936876141f38089df0D1503D",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/7875.png",
  },
  {
    name: "Binance Coin",
    symbol: "BNB",
    address: "0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454",
    _scan:
      "https://ftmscan.com/token/0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png",
  },
  {
    name: "Woofy",
    symbol: "WOOFY",
    address: "0xD0660cD418a64a1d44E9214ad8e459324D8157f1",
    _scan:
      "https://ftmscan.com/token/0xD0660cD418a64a1d44E9214ad8e459324D8157f1",
    chainId: 250,
    decimals: 12,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/9719.png",
  },
  {
    name: "Anyswap",
    symbol: "ANY",
    address: "0xdDcb3fFD12750B45d32E084887fdf1aABAb34239",
    _scan:
      "https://ftmscan.com/token/0xdDcb3fFD12750B45d32E084887fdf1aABAb34239",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/anyswap/Brand-assets/master/logo/c-128-color-2.png",
  },
  {
    name: "Beefy.Finance",
    symbol: "BIFI",
    address: "0xd6070ae98b8069de6B494332d1A1a81B6179D960",
    _scan:
      "https://ftmscan.com/token/0xd6070ae98b8069de6B494332d1A1a81B6179D960",
    chainId: 250,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/12704/large/token.png",
  },
  {
    name: "TOMB",
    symbol: "TOMB",
    address: "0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7",
    _scan:
      "https://ftmscan.com/token/0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11495.png",
  },
  {
    name: "TSHARE",
    symbol: "TSHARE",
    address: "0x4cdF39285D7Ca8eB3f090fDA0C069ba5F4145B37",
    _scan:
      "https://ftmscan.com/token/0x4cdF39285D7Ca8eB3f090fDA0C069ba5F4145B37",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/16943.png",
  },
  {
    name: "BOMB",
    symbol: "BOMB",
    address: "0x8503eb4A136bDBeB323E37Aa6e0FA0C772228378",
    _scan:
      "https://ftmscan.com/token/0x8503eb4A136bDBeB323E37Aa6e0FA0C772228378",
    chainId: 250,
    decimals: 0,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/9085.png",
  },
  {
    name: "Boo MirrorWorld",
    symbol: "xBOO",
    address: "0xa48d959AE2E88f1dAA7D5F611E01908106dE7598",
    _scan:
      "https://ftmscan.com/token/0xa48d959AE2E88f1dAA7D5F611E01908106dE7598",
    chainId: 250,
    decimals: 18,
    logoURI: "https://ftmscan.com/token/images/xBOO_32.png",
  },
  {
    name: "Smart Token",
    symbol: "SMART",
    address: "0x34D33dc8Ac6f1650D94A7E9A972B47044217600b",
    _scan:
      "https://ftmscan.com/token/0x34D33dc8Ac6f1650D94A7E9A972B47044217600b",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/15540.png",
  },
  {
    name: "aUSD",
    symbol: "aUSD",
    address: "0x41e3dF7f716aB5AF28c1497B354D79342923196a",
    _scan:
      "https://ftmscan.com/token/0x41e3dF7f716aB5AF28c1497B354D79342923196a",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/fantom/0x41e3dF7f716aB5AF28c1497B354D79342923196a.png",
  },
  {
    name: "Fantom USD",
    symbol: "fUSD",
    address: "0xAd84341756Bf337f5a0164515b1f6F993D194E1f",
    _scan:
      "https://ftmscan.com/token/0xAd84341756Bf337f5a0164515b1f6F993D194E1f",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/16831.png",
  },
  {
    name: "Magic Internet Money",
    symbol: "MIM",
    address: "0x82f0B8B456c1A451378467398982d4834b6829c1",
    _scan:
      "https://ftmscan.com/token/0x82f0B8B456c1A451378467398982d4834b6829c1",
    chainId: 250,
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/16786/large/mimlogopng.png",
  },
  {
    name: "ShadeToken",
    symbol: "SHADE",
    address: "0x3A3841f5fa9f2c283EA567d5Aeea3Af022dD2262",
    _scan:
      "https://ftmscan.com/token/0x3A3841f5fa9f2c283EA567d5Aeea3Af022dD2262",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11504.png",
  },
  {
    name: "AtariToken",
    symbol: "ATRI",
    address: "0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b",
    _scan:
      "https://ftmscan.com/token/0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b",
    chainId: 250,
    decimals: 0,
    logoURI: "https://assets.coingecko.com/coins/images/12992/large/atari.png",
  },
  {
    name: "Cryptokek.com",
    symbol: "KEK",
    address: "0x627524d78B4fC840C887ffeC90563c7A42b671fD",
    _scan:
      "https://ftmscan.com/token/0x627524d78B4fC840C887ffeC90563c7A42b671fD",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/8135.png",
  },
  {
    name: "YEL Token",
    symbol: "YEL",
    address: "0xD3b71117E6C1558c1553305b44988cd944e97300",
    _scan:
      "https://ftmscan.com/token/0xD3b71117E6C1558c1553305b44988cd944e97300",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11301.png",
  },
  {
    name: "Scream",
    symbol: "SCREAM",
    address: "0xe0654C8e6fd4D733349ac7E09f6f23DA256bF475",
    _scan:
      "https://ftmscan.com/token/0xe0654C8e6fd4D733349ac7E09f6f23DA256bF475",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11497.png",
  },
  {
    name: "Tarot",
    symbol: "TAROT",
    address: "0xC5e2B037D30a390e62180970B3aa4E91868764cD",
    _scan:
      "https://ftmscan.com/token/0xC5e2B037D30a390e62180970B3aa4E91868764cD",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11409.png",
  },
  {
    name: "BABYBOO",
    symbol: "BABYBOO",
    address: "0x471762A7017A5B1A3e931F1A97aa03Ef1E7F4A73",
    _scan:
      "https://ftmscan.com/token/0x471762A7017A5B1A3e931F1A97aa03Ef1E7F4A73",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11764.png",
  },
  {
    name: "Death",
    symbol: "Death",
    address: "0xeaF45B62d9d0Bdc1D763baF306af5eDD7C0d7e55",
    _scan:
      "https://ftmscan.com/token/0xeaF45B62d9d0Bdc1D763baF306af5eDD7C0d7e55",
    chainId: 250,
    decimals: 9,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11994.png",
  },
  {
    name: "SteakToken",
    symbol: "STEAK",
    address: "0x05848B832E872d9eDd84AC5718D58f21fD9c9649",
    _scan:
      "https://ftmscan.com/token/0x05848B832E872d9eDd84AC5718D58f21fD9c9649",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11774.png",
  },
  {
    name: "Totem Finance",
    symbol: "TOTEM",
    address: "0x31a37aedC0C18AA139e120e1CDC673BbB2063e6f",
    _scan:
      "https://ftmscan.com/token/0x31a37aedC0C18AA139e120e1CDC673BbB2063e6f",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11684.png",
  },
  {
    name: "OliveCash Token",
    symbol: "fOLIVE",
    address: "0xA9937092c4E2B0277C16802Cc8778D252854688A",
    _scan:
      "https://ftmscan.com/token/0xA9937092c4E2B0277C16802Cc8778D252854688A",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/10685.png",
  },
  {
    name: "Syfin",
    symbol: "SYF",
    address: "0x1BCF4DC879979C68fA255f731FE8Dcf71970c9bC",
    _scan:
      "https://ftmscan.com/token/0x1BCF4DC879979C68fA255f731FE8Dcf71970c9bC",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11692.png",
  },
  {
    name: "FTM1337",
    symbol: "ELITE",
    address: "0xf43Cc235E686d7BC513F53Fbffb61F760c3a1882",
    _scan:
      "https://ftmscan.com/token/0xf43Cc235E686d7BC513F53Fbffb61F760c3a1882",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13436.png",
  },
  {
    name: "Fantom Oasis Token",
    symbol: "FTMO",
    address: "0x9bD0611610A0f5133e4dd1bFdd71C5479Ee77f37",
    _scan:
      "https://ftmscan.com/token/0x9bD0611610A0f5133e4dd1bFdd71C5479Ee77f37",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11907.png",
  },
  {
    name: "Wootrade Network",
    symbol: "WOO",
    address: "0x6626c47c00F1D87902fc13EECfaC3ed06D5E8D8a",
    _scan:
      "https://ftmscan.com/token/0x6626c47c00F1D87902fc13EECfaC3ed06D5E8D8a",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/7501.png",
  },
  {
    name: "fSWAMP Token",
    symbol: "fSWAMP",
    address: "0x23cBC7C95a13071562af2C4Fb1Efa7a284d0543a",
    _scan:
      "https://ftmscan.com/token/0x23cBC7C95a13071562af2C4Fb1Efa7a284d0543a",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/9082.png",
  },
  {
    name: "Treeb",
    symbol: "TREEB",
    address: "0xc60D7067dfBc6f2caf30523a064f416A5Af52963",
    _scan:
      "https://ftmscan.com/token/0xc60D7067dfBc6f2caf30523a064f416A5Af52963",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12301.png",
  },
  {
    name: "Morpheus Token",
    symbol: "MORPH",
    address: "0x0789fF5bA37f72ABC4D561D00648acaDC897b32d",
    _scan:
      "https://ftmscan.com/token/0x0789fF5bA37f72ABC4D561D00648acaDC897b32d",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11896.png",
  },
  {
    name: "Timechain Swap Token",
    symbol: "TCS",
    address: "0xFbfAE0DD49882e503982f8eb4b8B1e464ecA0b91",
    _scan:
      "https://ftmscan.com/token/0xFbfAE0DD49882e503982f8eb4b8B1e464ecA0b91",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12463.png",
  },
  {
    name: "FANG Token",
    symbol: "FANG",
    address: "0x49894fCC07233957c35462cfC3418Ef0CC26129f",
    _scan:
      "https://ftmscan.com/token/0x49894fCC07233957c35462cfC3418Ef0CC26129f",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12671.png",
  },
  {
    name: "Liquid Driver",
    symbol: "LQDR",
    address: "0x10b620b2dbAC4Faa7D7FFD71Da486f5D44cd86f9",
    _scan:
      "https://ftmscan.com/token/0x10b620b2dbAC4Faa7D7FFD71Da486f5D44cd86f9",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13246.png",
  },
  {
    name: "Geist.Finance Protocol Token",
    symbol: "GEIST",
    address: "0xd8321AA83Fb0a4ECd6348D4577431310A6E0814d",
    _scan:
      "https://ftmscan.com/token/0xd8321AA83Fb0a4ECd6348D4577431310A6E0814d",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12576.png",
  },
  {
    name: "Cougar Token",
    symbol: "CGS",
    address: "0x5a2e451Fb1b46FDE7718315661013ae1aE68e28C",
    _scan:
      "https://ftmscan.com/token/0x5a2e451Fb1b46FDE7718315661013ae1aE68e28C",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13106.png",
  },
  {
    name: "Spell Token",
    symbol: "SPELL",
    address: "0x468003B688943977e6130F4F68F23aad939a1040",
    _scan:
      "https://ftmscan.com/token/0x468003B688943977e6130F4F68F23aad939a1040",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11289.png",
  },
  {
    name: "CoffinDollar",
    symbol: "CoUSD",
    address: "0x0DeF844ED26409C5C46dda124ec28fb064D90D27",
    _scan:
      "https://ftmscan.com/token/0x0DeF844ED26409C5C46dda124ec28fb064D90D27",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12766.png",
  },
  {
    name: "CoffinToken",
    symbol: "COFFIN",
    address: "0x593Ab53baFfaF1E821845cf7080428366F030a9c",
    _scan:
      "https://ftmscan.com/token/0x593Ab53baFfaF1E821845cf7080428366F030a9c",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12765.png",
  },
  {
    name: "Font",
    symbol: "FONT",
    address: "0xbbc4A8d076F4B1888fec42581B6fc58d242CF2D5",
    _scan:
      "https://ftmscan.com/token/0xbbc4A8d076F4B1888fec42581B6fc58d242CF2D5",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/8601.png",
  },
  {
    name: "CyberFi Token",
    symbol: "CFi",
    address: "0x6a545f9c64d8f7B957D8D2e6410B52095A9E6c29",
    _scan:
      "https://ftmscan.com/token/0x6a545f9c64d8f7B957D8D2e6410B52095A9E6c29",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/7699.png",
    bridgeId: "cfiv3",
    nativeChain: 1,
  },
  {
    name: "DarkMatter",
    symbol: "DMD",
    address: "0x90E892FED501ae00596448aECF998C88816e5C0F",
    _scan:
      "https://ftmscan.com/token/0x90E892FED501ae00596448aECF998C88816e5C0F",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12675.png",
    bridgeId: "",
  },
  {
    name: "FTM-Meso",
    symbol: "MESO",
    address: "0x4D9361A86D038C8adA3db2457608e2275B3E08d4",
    _scan:
      "https://ftmscan.com/token/0x4D9361A86D038C8adA3db2457608e2275B3E08d4",
    chainId: 250,
    decimals: 18,
    logoURI: "https://ftmscan.com/token/images/mesofinance_32.png",
    bridgeId: "",
  },
  {
    name: "Dola USD Stablecoin",
    symbol: "DOLA",
    address: "0x3129662808bEC728a27Ab6a6b9AFd3cBacA8A43c",
    _scan:
      "https://ftmscan.com/token/0x3129662808bEC728a27Ab6a6b9AFd3cBacA8A43c",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/19191.png",
    bridgeId: "dolav5",
    nativeChain: 1,
  },
  {
    name: "TravaFinance Token",
    symbol: "TRAVA",
    address: "0x477a9D5dF9bedA06F6b021136a2efe7BE242fCC9",
    _scan:
      "https://ftmscan.com/token/0x477a9D5dF9bedA06F6b021136a2efe7BE242fCC9",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11209.png",
    bridgeId: "",
  },
  {
    name: "summitdefi.com",
    symbol: "SUMMIT",
    address: "0x8F9bCCB6Dd999148Da1808aC290F2274b13D7994",
    _scan:
      "https://ftmscan.com/token/0x8F9bCCB6Dd999148Da1808aC290F2274b13D7994",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13123.png",
  },
  {
    name: "Yoshi.exchange",
    symbol: "YOSHI",
    address: "0x3dc57B391262e3aAe37a08D91241f9bA9d58b570",
    _scan:
      "https://ftmscan.com/token/0x3dc57B391262e3aAe37a08D91241f9bA9d58b570",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13118.png",
  },
  {
    name: "Fantom Doge",
    symbol: "RIP",
    address: "0x1D43697D67cB5D0436cc38d583Ca473a1bFEbC7a",
    _scan:
      "https://ftmscan.com/token/0x1D43697D67cB5D0436cc38d583Ca473a1bFEbC7a",
    chainId: 250,
    decimals: 9,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/11787.png",
  },
  {
    name: "Metti Inu",
    symbol: "Metti",
    address: "0x42aE8468A1FDDB965d420BD71368a87Ec3a2B4b8",
    _scan:
      "https://ftmscan.com/token/0x42aE8468A1FDDB965d420BD71368a87Ec3a2B4b8",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13430.png",
  },
  {
    name: "ScareCrow",
    symbol: "SCARE",
    address: "0x46e1Ee17f51c52661D04238F1700C547dE3B84A1",
    _scan:
      "https://ftmscan.com/token/0x46e1Ee17f51c52661D04238F1700C547dE3B84A1",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12827.png",
  },
  {
    name: "Exodia",
    symbol: "EXOD",
    address: "0x3b57f3FeAaF1e8254ec680275Ee6E7727C7413c7",
    _scan:
      "https://ftmscan.com/token/0x3b57f3FeAaF1e8254ec680275Ee6E7727C7413c7",
    chainId: 250,
    decimals: 9,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13642.png",
  },
  {
    name: "FantomStarter",
    symbol: "FS",
    address: "0xC758295Cd1A564cdb020a78a681a838CF8e0627D",
    _scan:
      "https://ftmscan.com/token/0xC758295Cd1A564cdb020a78a681a838CF8e0627D",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13237.png",
    bridgeId: "",
  },
  {
    name: "ArtWallet",
    symbol: "1ART",
    address: "0xD3c325848D7c6E29b574Cb0789998b2ff901f17E",
    _scan:
      "https://ftmscan.com/token/0xD3c325848D7c6E29b574Cb0789998b2ff901f17E",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12929.png",
    bridgeId: "",
  },
  {
    name: "Bouje Token",
    symbol: "BOUJE",
    address: "0x37F70aa9fEfc8971117BD53A1Ddc2372aa7Eec41",
    _scan:
      "https://ftmscan.com/token/0x37F70aa9fEfc8971117BD53A1Ddc2372aa7Eec41",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13522.png",
    bridgeId: "",
  },
  {
    name: "Feeder.finance",
    symbol: "FEED",
    address: "0x5d5530eb3147152FE78d5C4bFEeDe054c8d1442A",
    _scan:
      "https://ftmscan.com/token/0x5d5530eb3147152FE78d5C4bFEeDe054c8d1442A",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/14257.png",
    bridgeId: "",
  },
  {
    name: "JulSwap",
    symbol: "JulD",
    address: "0xEFF6FcfBc2383857Dd66ddf57effFC00d58b7d9D",
    _scan:
      "https://ftmscan.com/token/0xEFF6FcfBc2383857Dd66ddf57effFC00d58b7d9D",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/8164.png",
    bridgeId: "",
  },
  {
    name: "Hector",
    symbol: "HEC",
    address: "0x5C4FDfc5233f935f20D2aDbA572F770c2E377Ab0",
    _scan:
      "https://ftmscan.com/token/0x5C4FDfc5233f935f20D2aDbA572F770c2E377Ab0",
    chainId: 250,
    decimals: 9,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13881.png",
    bridgeId: "",
  },
  {
    name: "Spartacus",
    symbol: "SPA",
    address: "0x5602df4A94eB6C680190ACCFA2A475621E0ddBdc",
    _scan:
      "https://ftmscan.com/token/0x5602df4A94eB6C680190ACCFA2A475621E0ddBdc",
    chainId: 250,
    decimals: 9,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13748.png",
    bridgeId: "",
  },
  {
    name: "Fantohm",
    symbol: "FHM",
    address: "0xfa1FBb8Ef55A4855E5688C0eE13aC3f202486286",
    _scan:
      "https://ftmscan.com/token/0xfa1FBb8Ef55A4855E5688C0eE13aC3f202486286",
    chainId: 250,
    decimals: 9,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/14063.png",
    bridgeId: "",
  },
  {
    name: "SoulPower",
    symbol: "SOUL",
    address: "0xe2fb177009FF39F52C0134E8007FA0e4BaAcBd07",
    _scan:
      "https://ftmscan.com/token/0xe2fb177009FF39F52C0134E8007FA0e4BaAcBd07",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13342.png",
    bridgeId: "",
  },
  {
    name: "TrueUSD",
    symbol: "TUSD",
    address: "0x9879aBDea01a879644185341F7aF7d8343556B7a",
    _scan:
      "https://ftmscan.com/token/0x9879aBDea01a879644185341F7aF7d8343556B7a",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/2563.png",
    bridgeId: "",
  },
  {
    name: "moda",
    symbol: "MODA",
    address: "0x6496994241804D7fE2b032901931e03bCD82301F",
    _scan:
      "https://ftmscan.com/token/0x6496994241804D7fE2b032901931e03bCD82301F",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/15747.png",
    bridgeId: "",
  },
  {
    name: "Raven",
    symbol: "RAVEN",
    address: "0x175cbf2809acFD7521fDd387d65aac523Fe4076F",
    _scan:
      "https://ftmscan.com/token/0x175cbf2809acFD7521fDd387d65aac523Fe4076F",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/14919.png",
    bridgeId: "",
  },
  {
    name: "PaintSwap",
    symbol: "BRUSH",
    address: "0x85dec8c4B2680793661bCA91a8F129607571863d",
    _scan:
      "https://ftmscan.com/token/0x85dec8c4B2680793661bCA91a8F129607571863d",
    chainId: 250,
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/13229.png",
  },
  {
    name: "PILLS Token",
    symbol: "PILLS",
    address: "0xB66b5D38E183De42F21e92aBcAF3c712dd5d6286",
    _scan:
      "https://ftmscan.com/token/0xB66b5D38E183De42F21e92aBcAF3c712dd5d6286",
    chainId: 250,
    decimals: 18,
    logoURI: "https://ftmscan.com/token/images/morpheusfinftm_32.png",
  },
  {
    chainId: 250,
    address: "0xfB98B335551a418cD0737375a2ea0ded62Ea213b",
    _scan:
      "https://ftmscan.com/token/0xfB98B335551a418cD0737375a2ea0ded62Ea213b",
    decimals: 18,
    name: "MAI",
    symbol: "MAI",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/MAI.svg",
  },
];

export default fantomTokens;
