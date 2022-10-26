const optimismTokens = [
  {
    chainId: 10,
    address: "0x61BAADcF22d2565B0F471b291C475db5555e0b76",
    _scan:
      "https://optimistic.etherscan.io/token/0x61BAADcF22d2565B0F471b291C475db5555e0b76",
    name: "Aelin Protocol",
    symbol: "AELIN",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/AELIN/logo.png",
  },
  {
    chainId: 10,
    address: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
    _scan:
      "https://optimistic.etherscan.io/token/0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/ETH/logo.svg",
  },
  {
    chainId: 10,
    address: "0x395ae52bb17aef68c2888d941736a71dc6d4e125",
    _scan:
      "https://optimistic.etherscan.io/token/0x395ae52bb17aef68c2888d941736a71dc6d4e125",
    name: "PoolTogether",
    symbol: "POOL",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/POOL/logo.svg",
  },
  {
    chainId: 10,
    address: "0x374Ad0f47F4ca39c78E5Cc54f1C9e426FF8f231A",
    _scan:
      "https://optimistic.etherscan.io/token/0x374Ad0f47F4ca39c78E5Cc54f1C9e426FF8f231A",
    name: "Premia",
    symbol: "PREMIA",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/PREMIA/logo.svg",
  },
  {
    chainId: 10,
    address: "0xef6301da234fc7b0545c6e877d3359fe0b9e50a4",
    _scan:
      "https://optimistic.etherscan.io/token/0xef6301da234fc7b0545c6e877d3359fe0b9e50a4",
    name: "SUKU",
    symbol: "SUKU",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/SUKU/logo.png",
  },
  {
    chainId: 10,
    address: "0xd8f365c2c85648f9b89d9f1bf72c0ae4b1c36cfd",
    _scan:
      "https://optimistic.etherscan.io/token/0xd8f365c2c85648f9b89d9f1bf72c0ae4b1c36cfd",
    name: "TheDAO",
    symbol: "TheDAO",
    decimals: 16,
    logoURI: "https://ethereum-optimism.github.io/data/TheDAO/logo.svg",
  },
  {
    chainId: 10,
    address: "0xcB59a0A753fDB7491d5F3D794316F1adE197B21E",
    _scan:
      "https://optimistic.etherscan.io/token/0xcB59a0A753fDB7491d5F3D794316F1adE197B21E",
    name: "TrueUSD",
    symbol: "TUSD",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/TUSD/logo.png",
  },
  {
    chainId: 10,
    address: "0xD1917629B3E6A72E6772Aab5dBe58Eb7FA3C2F33",
    _scan:
      "https://optimistic.etherscan.io/token/0xD1917629B3E6A72E6772Aab5dBe58Eb7FA3C2F33",
    name: "0x Protocol Token",
    symbol: "ZRX",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/ZRX/logo.png",
  },
  {
    chainId: 10,
    address: "0x7113370218f31764C1B6353BDF6004d86fF6B9cc",
    _scan:
      "https://optimistic.etherscan.io/token/0x7113370218f31764C1B6353BDF6004d86fF6B9cc",
    name: "Decentralized USD",
    symbol: "USDD",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/USDD/logo.png",
  },
  {
    chainId: 10,
    address: "0x8700daec35af8ff88c16bdf0418774cb3d7599b4",
    _scan:
      "https://optimistic.etherscan.io/token/0x8700daec35af8ff88c16bdf0418774cb3d7599b4",
    name: "Synthetix",
    symbol: "SNX",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/SNX.svg",
  },
  {
    chainId: 10,
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    _scan:
      "https://optimistic.etherscan.io/token/0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    name: "Dai stable coin",
    symbol: "DAI",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/DAI/logo.svg",
  },
  {
    chainId: 10,
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    _scan:
      "https://optimistic.etherscan.io/token/0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    logoURI: "https://ethereum-optimism.github.io/data/USDT/logo.png",
  },
  {
    chainId: 10,
    address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    _scan:
      "https://optimistic.etherscan.io/token/0x68f180fcCe6836688e9084f035309E29Bf0A2095",
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    logoURI: "https://ethereum-optimism.github.io/data/WBTC/logo.svg",
  },
  {
    chainId: 10,
    address: "0xe0BB0D3DE8c10976511e5030cA403dBf4c25165B",
    _scan:
      "https://optimistic.etherscan.io/token/0xe0BB0D3DE8c10976511e5030cA403dBf4c25165B",
    name: "0xBitcoin",
    symbol: "0xBTC",
    decimals: 8,
    logoURI: "https://ethereum-optimism.github.io/data/0xBTC/logo.png",
  },
  {
    chainId: 10,
    address: "0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6",
    _scan:
      "https://optimistic.etherscan.io/token/0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6",
    name: "Chainlink",
    symbol: "LINK",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/LINK/logo.png",
  },
  {
    chainId: 10,
    address: "0x65559aA14915a70190438eF90104769e5E890A00",
    _scan:
      "https://optimistic.etherscan.io/token/0x65559aA14915a70190438eF90104769e5E890A00",
    name: "Ethereum Name Service",
    symbol: "ENS",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/ENS/logo.png",
  },
  {
    chainId: 10,
    address: "0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9",
    _scan:
      "https://optimistic.etherscan.io/token/0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9",
    name: "Synthetix USD",
    symbol: "sUSD",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/sUSD/logo.svg",
  },
  {
    chainId: 10,
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    _scan:
      "https://optimistic.etherscan.io/token/0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoURI: "https://ethereum-optimism.github.io/data/USDC/logo.png",
  },
  {
    chainId: 10,
    address: "0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49",
    _scan:
      "https://optimistic.etherscan.io/token/0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49",
    name: "Synthetic Ether",
    symbol: "sETH",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/sETH/logo.svg",
  },
  {
    chainId: 10,
    address: "0x298B9B95708152ff6968aafd889c6586e9169f1D",
    _scan:
      "https://optimistic.etherscan.io/token/0x298B9B95708152ff6968aafd889c6586e9169f1D",
    name: "Synthetic Bitcoin",
    symbol: "sBTC",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/sBTC/logo.svg",
  },
  {
    chainId: 10,
    address: "0xc5Db22719A06418028A40A9B5E9A7c02959D0d08",
    _scan:
      "https://optimistic.etherscan.io/token/0xc5Db22719A06418028A40A9B5E9A7c02959D0d08",
    name: "Synthetic Chainlink",
    symbol: "sLINK",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/sLINK/logo.svg",
  },
  {
    chainId: 10,
    address: "0x6fd9d7ad17242c41f7131d257212c54a0e816691",
    _scan:
      "https://optimistic.etherscan.io/token/0x6fd9d7ad17242c41f7131d257212c54a0e816691",
    name: "Uniswap",
    symbol: "UNI",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/UNI/logo.png",
  },
  {
    chainId: 10,
    address: "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819",
    _scan:
      "https://optimistic.etherscan.io/token/0xc40f949f8a4e094d1b49a23ea9241d289b7b2819",
    name: "LUSD Stablecoin",
    symbol: "LUSD",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/LUSD/logo.svg",
  },
  {
    chainId: 10,
    address: "0xb548f63d4405466b36c0c0ac3318a22fdcec711a",
    _scan:
      "https://optimistic.etherscan.io/token/0xb548f63d4405466b36c0c0ac3318a22fdcec711a",
    name: "Rari Governance Token",
    symbol: "RGT",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/RGT/logo.png",
  },
  {
    chainId: 10,
    address: "0x7FB688CCf682d58f86D7e38e03f9D22e7705448B",
    _scan:
      "https://optimistic.etherscan.io/token/0x7FB688CCf682d58f86D7e38e03f9D22e7705448B",
    name: "Rai Reflex Index",
    symbol: "RAI",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/RAI/logo.svg",
  },
  {
    chainId: 10,
    address: "0x9bcef72be871e61ed4fbbc7630889bee758eb81d",
    _scan:
      "https://optimistic.etherscan.io/token/0x9bcef72be871e61ed4fbbc7630889bee758eb81d",
    name: "Rocket Pool ETH",
    symbol: "rETH",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/rETH/logo.png",
  },
  {
    chainId: 10,
    address: "0x00F932F0FE257456b32dedA4758922E56A4F4b42",
    _scan:
      "https://optimistic.etherscan.io/token/0x00F932F0FE257456b32dedA4758922E56A4F4b42",
    name: "Paper",
    symbol: "PAPER",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/PAPER/logo.svg",
  },
  {
    chainId: 10,
    address: "0x7c6b91d9be155a6db01f749217d76ff02a7227f2",
    _scan:
      "https://optimistic.etherscan.io/token/0x7c6b91d9be155a6db01f749217d76ff02a7227f2",
    name: "Sarcophagus",
    symbol: "SARCO",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/SARCO/logo.png",
  },
  {
    chainId: 10,
    address: "0x5029C236320b8f15eF0a657054B84d90bfBEDED3",
    _scan:
      "https://optimistic.etherscan.io/token/0x5029C236320b8f15eF0a657054B84d90bfBEDED3",
    name: "BitANT",
    symbol: "BitANT",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/BitANT/logo.png",
  },
  {
    chainId: 10,
    address: "0xc98B98d17435AA00830c87eA02474C5007E1f272",
    _scan:
      "https://optimistic.etherscan.io/token/0xc98B98d17435AA00830c87eA02474C5007E1f272",
    name: "BitBTC",
    symbol: "BitBTC",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/BitBTC/logo.png",
  },
  {
    chainId: 10,
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    _scan:
      "https://optimistic.etherscan.io/token/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    name: "Lyra",
    symbol: "LYRA",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/LYRA/logo.png",
  },
  {
    chainId: 10,
    address: "0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea",
    _scan:
      "https://optimistic.etherscan.io/token/0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea",
    name: "UMA Voting Token v1",
    symbol: "UMA",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/UMA/logo.png",
  },
  {
    chainId: 10,
    address: "0x9e1028F5F1D5eDE59748FFceE5532509976840E0",
    _scan:
      "https://optimistic.etherscan.io/token/0x9e1028F5F1D5eDE59748FFceE5532509976840E0",
    name: "Perpetual",
    symbol: "PERP",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/PERP/logo.png",
  },
  {
    chainId: 10,
    address: "0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3",
    _scan:
      "https://optimistic.etherscan.io/token/0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3",
    name: "dForce",
    symbol: "DF",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/DF/logo.svg",
  },
  {
    chainId: 10,
    address: "0xbfD291DA8A403DAAF7e5E9DC1ec0aCEaCd4848B9",
    _scan:
      "https://optimistic.etherscan.io/token/0xbfD291DA8A403DAAF7e5E9DC1ec0aCEaCd4848B9",
    name: "dForce USD",
    symbol: "USX",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/USX/logo.svg",
  },
  {
    chainId: 10,
    address: "0x3e7eF8f50246f725885102E8238CBba33F276747",
    _scan:
      "https://optimistic.etherscan.io/token/0x3e7eF8f50246f725885102E8238CBba33F276747",
    name: "BarnBridge Governance Token",
    symbol: "BOND",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/BOND/logo.svg",
  },
  {
    chainId: 10,
    address: "0x4200000000000000000000000000000000000006",
    _scan:
      "https://optimistic.etherscan.io/token/0x4200000000000000000000000000000000000006",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/WETH/logo.png",
  },
  {
    chainId: 10,
    address: "0x7b0bcC23851bBF7601efC9E9FE532Bf5284F65d3",
    _scan:
      "https://optimistic.etherscan.io/token/0x7b0bcC23851bBF7601efC9E9FE532Bf5284F65d3",
    name: "Erica Social Token",
    symbol: "EST",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/EST/logo.png",
  },
  {
    chainId: 10,
    address: "0x1da650c3b2daa8aa9ff6f661d4156ce24d08a062",
    _scan:
      "https://optimistic.etherscan.io/token/0x1da650c3b2daa8aa9ff6f661d4156ce24d08a062",
    name: "Dentacoin",
    symbol: "DCN",
    decimals: 0,
    logoURI: "https://ethereum-optimism.github.io/data/DCN/logo.svg",
  },
  {
    chainId: 10,
    address: "0xf98dcd95217e15e05d8638da4c91125e59590b07",
    _scan:
      "https://optimistic.etherscan.io/token/0xf98dcd95217e15e05d8638da4c91125e59590b07",
    name: "Kromatika",
    symbol: "KROM",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/KROM/logo.png",
  },
  {
    chainId: 10,
    address: "0xAF9fE3B5cCDAe78188B1F8b9a49Da7ae9510F151",
    _scan:
      "https://optimistic.etherscan.io/token/0xAF9fE3B5cCDAe78188B1F8b9a49Da7ae9510F151",
    name: "dHEDGE DAO Token",
    symbol: "DHT",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/DHT/logo.svg",
  },
  {
    chainId: 10,
    address: "0xab7badef82e9fe11f6f33f87bc9bc2aa27f2fcb5",
    _scan:
      "https://optimistic.etherscan.io/token/0xab7badef82e9fe11f6f33f87bc9bc2aa27f2fcb5",
    name: "Maker",
    symbol: "MKR",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/MKR.svg",
  },
  {
    chainId: 10,
    address: "0x3bB4445D30AC020a84c1b5A8A2C6248ebC9779D0",
    _scan:
      "https://optimistic.etherscan.io/token/0x3bB4445D30AC020a84c1b5A8A2C6248ebC9779D0",
    name: "Theranos Coin",
    symbol: "LIZ",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/LIZ/logo.png",
  },
  {
    chainId: 10,
    address: "0x3390108E913824B8eaD638444cc52B9aBdF63798",
    _scan:
      "https://optimistic.etherscan.io/token/0x3390108E913824B8eaD638444cc52B9aBdF63798",
    name: "Mask Network",
    symbol: "MASK",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/MASK/logo.svg",
  },
  {
    chainId: 10,
    address: "0x0994206dfe8de6ec6920ff4d779b0d950605fb53",
    _scan:
      "https://optimistic.etherscan.io/token/0x0994206dfe8de6ec6920ff4d779b0d950605fb53",
    name: "Curve DAO Token",
    symbol: "CRV",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/CRV/logo.png",
  },
  {
    chainId: 10,
    address: "0xcfD1D50ce23C46D3Cf6407487B2F8934e96DC8f9",
    _scan:
      "https://optimistic.etherscan.io/token/0xcfD1D50ce23C46D3Cf6407487B2F8934e96DC8f9",
    name: "SPANK",
    symbol: "SPANK",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/SPANK/logo.png",
  },
  {
    chainId: 10,
    address: "0xFEaA9194F9F8c1B65429E31341a103071464907E",
    _scan:
      "https://optimistic.etherscan.io/token/0xFEaA9194F9F8c1B65429E31341a103071464907E",
    name: "LoopringCoin V2",
    symbol: "LRC",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/LRC/logo.png",
  },
  {
    chainId: 10,
    address: "0x217D47011b23BB961eB6D93cA9945B7501a5BB11",
    _scan:
      "https://optimistic.etherscan.io/token/0x217D47011b23BB961eB6D93cA9945B7501a5BB11",
    name: "Optimistic Thales Token",
    symbol: "THALES",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/THALES/logo.png",
  },
  {
    chainId: 10,
    address: "0xBA28feb4b6A6b81e3F26F08b83a19E715C4294fd",
    _scan:
      "https://optimistic.etherscan.io/token/0xBA28feb4b6A6b81e3F26F08b83a19E715C4294fd",
    name: "UST (Wormhole)",
    symbol: "UST",
    decimals: 6,
    logoURI: "https://ethereum-optimism.github.io/data/UST/logo.png",
  },
  {
    chainId: 10,
    address: "0xE4F27b04cC7729901876B44f4EAA5102EC150265",
    _scan:
      "https://optimistic.etherscan.io/token/0xE4F27b04cC7729901876B44f4EAA5102EC150265",
    name: "CryptoFranc",
    symbol: "XCHF",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/XCHF/logo.png",
  },
  {
    chainId: 10,
    address: "0x76FB31fb4af56892A25e32cFC43De717950c9278",
    _scan:
      "https://optimistic.etherscan.io/token/0x76FB31fb4af56892A25e32cFC43De717950c9278",
    name: "Aave Token",
    symbol: "AAVE",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/AAVE/logo.svg",
  },
  {
    chainId: 10,
    address: "0x81ab7e0d570b01411fcc4afd3d50ec8c241cb74b",
    _scan:
      "https://optimistic.etherscan.io/token/0x81ab7e0d570b01411fcc4afd3d50ec8c241cb74b",
    name: "Equalizer",
    symbol: "EQZ",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/EQZ/logo.png",
  },
  {
    chainId: 10,
    address: "0x117cFd9060525452db4A34d51c0b3b7599087f05",
    _scan:
      "https://optimistic.etherscan.io/token/0x117cFd9060525452db4A34d51c0b3b7599087f05",
    name: "Geyser",
    symbol: "GYSR",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/GYSR/logo.png",
  },
  {
    chainId: 10,
    address: "0xFE8B128bA8C78aabC59d4c64cEE7fF28e9379921",
    _scan:
      "https://optimistic.etherscan.io/token/0xFE8B128bA8C78aabC59d4c64cEE7fF28e9379921",
    name: "Balancer",
    symbol: "BAL",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/BAL/logo.png",
  },
  {
    chainId: 10,
    address: "0x1eba7a6a72c894026cd654ac5cdcf83a46445b08",
    _scan:
      "https://optimistic.etherscan.io/token/0x1eba7a6a72c894026cd654ac5cdcf83a46445b08",
    name: "Gitcoin",
    symbol: "GTC",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/GTC/logo.svg",
  },
  {
    chainId: 10,
    address: "0x4200000000000000000000000000000000000042",
    _scan:
      "https://optimistic.etherscan.io/token/0x4200000000000000000000000000000000000042",
    name: "Optimism",
    symbol: "OP",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/OP/logo.png",
  },
  {
    chainId: 10,
    address: "0x8aE125E8653821E851F12A49F7765db9a9ce7384",
    _scan:
      "https://optimistic.etherscan.io/token/0x8aE125E8653821E851F12A49F7765db9a9ce7384",
    name: "Dola USD Stablecoin",
    symbol: "DOLA",
    decimals: 18,
    logoURI: "https://ethereum-optimism.github.io/data/DOLA/logo.png",
  },
  {
    chainId: 10,
    address: "0x3c8B650257cFb5f272f799F5e2b4e65093a11a05",
    _scan:
      "https://optimistic.etherscan.io/token/0x3c8B650257cFb5f272f799F5e2b4e65093a11a05",
    name: "Velodrome",
    symbol: "VELO",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/VELO.svg",
  },
  {
    chainId: 10,
    address: "0xdFA46478F9e5EA86d57387849598dbFB2e964b02",
    _scan:
      "https://optimistic.etherscan.io/token/0xdFA46478F9e5EA86d57387849598dbFB2e964b02",
    decimals: 18,
    name: "MAI",
    symbol: "MAI",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/MAI.svg",
  },
  {
    chainId: 10,
    address: "0x2E3D870790dC77A83DD1d18184Acc7439A53f475",
    _scan:
      "https://optimistic.etherscan.io/token/0x2E3D870790dC77A83DD1d18184Acc7439A53f475",
    decimals: 18,
    name: "Frax",
    symbol: "FRAX",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/FRAX.svg",
  },
  {
    chainId: 10,
    address: "0xC22885e06cd8507c5c74a948C59af853AEd1Ea5C",
    _scan:
      "https://optimistic.etherscan.io/token/0xC22885e06cd8507c5c74a948C59af853AEd1Ea5C",
    decimals: 18,
    name: "Decentralized USD",
    symbol: "USDD",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/USDD.svg",
  },
  {
    chainId: 10,
    address: "0x67CCEA5bb16181E7b4109c9c2143c24a1c2205Be",
    _scan:
      "https://optimistic.etherscan.io/token/0x67CCEA5bb16181E7b4109c9c2143c24a1c2205Be",
    decimals: 18,
    name: "Frax Share",
    symbol: "FXS",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/FXS.svg",
  },
  {
    chainId: 10,
    address: "0xEe9801669C6138E84bD50dEB500827b776777d28",
    _scan:
      "https://optimistic.etherscan.io/token/0xEe9801669C6138E84bD50dEB500827b776777d28",
    decimals: 18,
    name: "O3 Swap Token",
    symbol: "O3",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/O3.png",
  },
  {
    chainId: 10,
    address: "0xb12c13e66AdE1F72f71834f2FC5082Db8C091358",
    _scan:
      "https://optimistic.etherscan.io/token/0xb12c13e66AdE1F72f71834f2FC5082Db8C091358",
    decimals: 18,
    name: "ROOBEE",
    symbol: "ROOBEE",
    logoURI:
      "https://raw.githubusercontent.com/KyberNetwork/ks-assets/main/img/token/ROOBEE.png",
  },
];

export default optimismTokens;
