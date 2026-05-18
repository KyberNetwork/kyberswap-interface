export enum ApplicationModal {
  NETWORK = 'NETWORK',
  WALLET = 'WALLET',
  TRANSACTION_SETTINGS = 'TRANSACTION_SETTINGS',
  CLAIM_POPUP = 'CLAIM_POPUP',
  MENU = 'MENU',
  POOL_DETAIL = 'POOL_DETAIL',

  SHARE = 'SHARE',
  FAUCET_POPUP = 'FAUCET_POPUP',
  NOTIFICATION_CENTER = 'NOTIFICATION_CENTER',
  MENU_NOTI_CENTER = 'MENU_NOTI_CENTER',

  // KyberDAO
  SWITCH_TO_ETHEREUM = 'SWITCH_TO_ETHEREUM',
  DELEGATE_CONFIRM = 'DELEGATE_CONFIRM',
  YOUR_TRANSACTIONS_STAKE_KNC = 'YOUR_TRANSACTIONS_STAKE_KNC',
  MIGRATE_KNC = 'MIGRATE_KNC',
  KYBER_DAO_CLAIM = 'KYBER_DAO_CLAIM',

  RECAP = 'RECAP',
}

type ImplementedModalParams = {
  [ApplicationModal.SWITCH_TO_ETHEREUM]: { featureText: string }
  //... fill more here
}
export type ModalParams = {
  [modal in Exclude<ApplicationModal, keyof ImplementedModalParams>]?: undefined
} & ImplementedModalParams
