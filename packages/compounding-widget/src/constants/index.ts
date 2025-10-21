import { t } from '@lingui/macro';

export const ERROR_MESSAGE = {
  CONNECT_WALLET: 'Connect wallet',
  WRONG_NETWORK: 'Switch network',
};

export type ErrorMessage = (typeof ERROR_MESSAGE)[keyof typeof ERROR_MESSAGE];

const ERROR_MESSAGE_TRANSLATIONS: Record<ErrorMessage, string> = {
  [ERROR_MESSAGE.CONNECT_WALLET]: t`Connect wallet`,
  [ERROR_MESSAGE.WRONG_NETWORK]: t`Switch network`,
};

export const translateErrorMessage = (error: string) => ERROR_MESSAGE_TRANSLATIONS[error as ErrorMessage] ?? error;

export const ZAP_SOURCE = 'kyberswap-earn';
