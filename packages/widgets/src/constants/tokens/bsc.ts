const bnbTokens = [
  {
    chainId: 56,
    address: "0xfe56d5892BDffC7BF58f2E84BE1b2C32D21C308b",
    _scan:
      "https://bscscan.com/token/0xfe56d5892BDffC7BF58f2E84BE1b2C32D21C308b",
    symbol: "KNC",
    name: "Kyber Network Crystal",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/dmm-interface/main/src/assets/images/KNC.svg",
  },
  {
    chainId: 56,
    address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    _scan:
      "https://bscscan.com/token/0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  },
  {
    chainId: 56,
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    _scan:
      "https://bscscan.com/token/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    symbol: "USDC",
    name: "USDC",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
  },
  {
    chainId: 56,
    address: "0x55d398326f99059fF775485246999027B3197955",
    _scan:
      "https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955",
    symbol: "USDT",
    name: "USDT",
    decimals: 18,
    logoURI: "https://coin.top/production/logo/usdtlogo.png",
  },
  {
    chainId: 56,
    address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    _scan:
      "https://bscscan.com/token/0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    symbol: "DAI",
    name: "DAI",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png",
  },
  {
    chainId: 56,
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    _scan:
      "https://bscscan.com/token/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    symbol: "WBNB",
    name: "Wrapped BNB",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/12591/small/binance-coin-logo.png",
  },
  {
    chainId: 56,
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    _scan:
      "https://bscscan.com/token/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    symbol: "BUSD",
    name: "BUSD",
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/9576/small/BUSD.png",
  },
  {
    chainId: 56,
    address: "0x633237C6FA30FAe46Cc5bB22014DA30e50a718cC",
    _scan:
      "https://bscscan.com/token/0x633237C6FA30FAe46Cc5bB22014DA30e50a718cC",
    symbol: "FIWA",
    name: "FIWA",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/18208/small/defi_warrior.PNG?1630986310",
  },
  {
    chainId: 56,
    address: "0xE8176d414560cFE1Bf82Fd73B986823B89E4F545",
    _scan:
      "https://bscscan.com/token/0xE8176d414560cFE1Bf82Fd73B986823B89E4F545",
    symbol: "HERO",
    name: "HERO",
    decimals: 18,
    logoURI:
      "https://assets.coingecko.com/coins/images/17700/small/stephero.PNG",
  },
  {
    chainId: 56,
    address: "0xD6Cce248263ea1e2b8cB765178C944Fc16Ed0727",
    _scan:
      "https://bscscan.com/token/0xD6Cce248263ea1e2b8cB765178C944Fc16Ed0727",
    symbol: "CTR",
    name: "Creator Chain",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/10391.png",
  },
  {
    chainId: 56,
    address: "0x4A9A2b2b04549C3927dd2c9668A5eF3fCA473623",
    _scan:
      "https://bscscan.com/token/0x4A9A2b2b04549C3927dd2c9668A5eF3fCA473623",
    symbol: "DF",
    name: "dForce",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/dforce-network/documents/2eea27372fda6a207f60fba4274ad68008d63694/logos/Lending/DF.svg",
  },
  {
    chainId: 56,
    address: "0xB5102CeE1528Ce2C760893034A4603663495fD72",
    _scan:
      "https://bscscan.com/token/0xB5102CeE1528Ce2C760893034A4603663495fD72",
    symbol: "USX",
    name: "dForce USD",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/dforce-network/documents/2eea27372fda6a207f60fba4274ad68008d63694/logos/Lending/USX.svg",
  },
  {
    chainId: 56,
    address: "0x367c17D19fCd0f7746764455497D63c8e8b2BbA3",
    _scan:
      "https://bscscan.com/token/0x367c17D19fCd0f7746764455497D63c8e8b2BbA3",
    symbol: "EUX",
    name: "dForce EUR",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/dforce-network/documents/2eea27372fda6a207f60fba4274ad68008d63694/logos/Lending/EUX.svg",
  },
  {
    chainId: 56,
    address: "0x3944aC66b9b9B40a6474022D6962b6cAA001b5E3",
    _scan:
      "https://bscscan.com/token/0x3944aC66b9b9B40a6474022D6962b6cAA001b5E3",
    symbol: "EBA",
    name: "Elpis Battle",
    decimals: 18,
    logoURI: "https://i.imgur.com/Tzs373u.png",
  },
  {
    chainId: 56,
    address: "0xE81257d932280AE440B17AFc5f07C8A110D21432",
    _scan:
      "https://bscscan.com/token/0xE81257d932280AE440B17AFc5f07C8A110D21432",
    symbol: "ZUKI",
    name: "ZUKI MOBA",
    decimals: 18,
    logoURI: "https://zukimoba.com/images/logos/logo.png",
  },
  {
    chainId: 56,
    address: "0xe91a8D2c584Ca93C7405F15c22CdFE53C29896E3",
    _scan:
      "https://bscscan.com/token/0xe91a8D2c584Ca93C7405F15c22CdFE53C29896E3",
    symbol: "DEXT",
    name: "DEXTools",
    decimals: 18,
    logoURI: "https://bscscan.com/token/images/dextools_32.png",
  },
  {
    chainId: 56,
    address: "0xd07e82440A395f3F3551b42dA9210CD1Ef4f8B24",
    _scan:
      "https://bscscan.com/token/0xd07e82440A395f3F3551b42dA9210CD1Ef4f8B24",
    symbol: "PRL",
    name: "Parallel",
    decimals: 18,
    logoURI: "https://i.imgur.com/99UaEcO.png",
  },
  {
    chainId: 56,
    address: "0xc04a23149efdF9A63697f3Eb60705147e9f07FfD",
    _scan:
      "https://bscscan.com/token/0xc04a23149efdF9A63697f3Eb60705147e9f07FfD",
    symbol: "GENI",
    name: "GemUni",
    decimals: 18,
    logoURI: "https://i.imgur.com/f5JZgpy.png",
  },
  {
    chainId: 56,
    address: "0x5fdAb5BDbad5277B383B3482D085f4bFef68828C",
    _scan:
      "https://bscscan.com/token/0x5fdAb5BDbad5277B383B3482D085f4bFef68828C",
    symbol: "DFH",
    name: "DeFiHorse",
    decimals: 18,
    logoURI: "https://i.imgur.com/nQryhVr.jpg",
  },
  {
    chainId: 56,
    address: "0x3019BF2a2eF8040C242C9a4c5c4BD4C81678b2A1",
    _scan:
      "https://bscscan.com/token/0x3019BF2a2eF8040C242C9a4c5c4BD4C81678b2A1",
    symbol: "GMT",
    name: "STEPN",
    decimals: 8,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/18069.png",
  },
  {
    chainId: 56,
    address: "0x301AF3Eff0c904Dc5DdD06FAa808f653474F7FcC",
    _scan:
      "https://bscscan.com/token/0x301AF3Eff0c904Dc5DdD06FAa808f653474F7FcC",
    symbol: "UNB",
    name: "Unbound",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/128x128/7846.png",
  },
  {
    chainId: 56,
    address: "0xE7C04392A3a426D532f83cA968Bcc0341E99583D",
    _scan:
      "https://bscscan.com/token/0xE7C04392A3a426D532f83cA968Bcc0341E99583D",
    symbol: "UND",
    name: "Unbound Dollar",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/128x128/7848.png",
  },
  {
    chainId: 56,
    address: "0x393C44A497706DDE15996BB0C7Bdf691A79De38a",
    _scan:
      "https://bscscan.com/token/0x393C44A497706DDE15996BB0C7Bdf691A79De38a",
    symbol: "FBL",
    name: "FootballBattle",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/fbl.png",
  },
  {
    chainId: 56,
    address: "0x261C94f2d3CcCAE76f86F6C8F2C93785DD6cE022",
    _scan:
      "https://bscscan.com/token/0x261C94f2d3CcCAE76f86F6C8F2C93785DD6cE022",
    symbol: "ATH",
    name: "AETHR",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/ath.png",
  },
  {
    chainId: 56,
    address: "0xCf909EF9A61dC5b05D46B5490A9f00D51c40Bb28",
    _scan:
      "https://bscscan.com/token/0xCf909EF9A61dC5b05D46B5490A9f00D51c40Bb28",
    symbol: "RICE",
    name: "Rice Wallet",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/RICE.png",
  },
  {
    chainId: 56,
    address: "0x8717e80EfF08F53A45b4A925009957E14860A8a8",
    _scan:
      "https://bscscan.com/token/0x8717e80EfF08F53A45b4A925009957E14860A8a8",
    symbol: "BHO",
    name: "BHO Network",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/12280.png",
  },
  {
    chainId: 56,
    address: "0x92dA433dA84d58DFe2aade1943349e491Cbd6820",
    _scan:
      "https://bscscan.com/token/0x92dA433dA84d58DFe2aade1943349e491Cbd6820",
    symbol: "RDR",
    name: "Rise of Defenders",
    decimals: 18,
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/16051.png",
  },
  {
    chainId: 56,
    address: "0x85EAC5Ac2F758618dFa09bDbe0cf174e7d574D5B",
    _scan:
      "https://bscscan.com/token/0x85EAC5Ac2F758618dFa09bDbe0cf174e7d574D5B",
    symbol: "TRX",
    name: "TRON",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/trx.png",
  },
  {
    chainId: 56,
    address: "0x715D400F88C167884bbCc41C5FeA407ed4D2f8A0",
    _scan:
      "https://bscscan.com/token/0x715D400F88C167884bbCc41C5FeA407ed4D2f8A0",
    symbol: "AXS",
    name: "Axie Infinity Shard",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/axs.png",
  },
  {
    chainId: 56,
    address: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402",
    _scan:
      "https://bscscan.com/token/0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402",
    symbol: "DOT",
    name: "Polkadot Token",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/dot.png",
  },
  {
    chainId: 56,
    address: "0x2222227E22102Fe3322098e4CBfE18cFebD57c95",
    _scan:
      "https://bscscan.com/token/0x2222227E22102Fe3322098e4CBfE18cFebD57c95",
    symbol: "TLM",
    name: "Alien Worlds Trilium",
    decimals: 4,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/tlm.png",
  },
  {
    chainId: 56,
    address: "0xeE89Bd9aF5e72B19B48cac3E51acDe3A09A3AdE3",
    _scan:
      "https://bscscan.com/token/0xeE89Bd9aF5e72B19B48cac3E51acDe3A09A3AdE3",
    symbol: "TRUSTK",
    name: "Trustkey Wallet",
    decimals: 18,
    logoURI:
      "https://blog.trustkeys.network/wp-content/uploads/2019/08/cropped-AppIcon_OK_500.png",
  },
  {
    chainId: 56,
    address: "0xDbCcd9131405DD1fE7320090Af337952B9845DFA",
    _scan:
      "https://bscscan.com/token/0xDbCcd9131405DD1fE7320090Af337952B9845DFA",
    symbol: "BOT",
    name: "Starbots Token (Wormhole)",
    decimals: 8,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/BOT.png",
  },
  {
    chainId: 56,
    address: "0x3F56e0c36d275367b8C502090EDF38289b3dEa0d",
    _scan:
      "https://bscscan.com/token/0x3F56e0c36d275367b8C502090EDF38289b3dEa0d",
    decimals: 18,
    name: "MAI",
    symbol: "MAI",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/MAI.svg",
  },
];

export default bnbTokens;
