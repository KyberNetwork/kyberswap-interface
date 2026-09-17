/**
 * How often vault and position data refetch. Earnings accrue, and withdrawal requests mature and get
 * filled, without any transaction from the user — nothing else would bring those figures up to date.
 */
export const VAULT_POLLING_INTERVAL = 30_000
