export enum LEGACY_POOL_VERSION {
  ELASTIC = 'elastic',
  CLASSIC = 'classic',
  ELASTIC_LEGACY = 'elastic-legacy',
}

export const ELASTIC_BASE_FEE_UNIT = 100_000

export const LEGACY_POOL_APP_PATHS = {
  FIND_POOL: '/find',
  CLASSIC_CREATE_POOL: '/create',
  CLASSIC_ADD_LIQ: '/add',
  CLASSIC_REMOVE_POOL: '/remove',
  ELASTIC_CREATE_POOL: '/elastic/add',
  ELASTIC_INCREASE_LIQ: '/elastic/increase',
  ELASTIC_REMOVE_POOL: '/elastic/remove',
  FARMS: '/farms',
  MY_POOLS: '/myPools',
  ELASTIC_LEGACY: '/elastic-legacy',
  ELASTIC_SNAPSHOT: '/elastic-snapshot',
} as const
