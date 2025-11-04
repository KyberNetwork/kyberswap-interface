import { t } from '@lingui/macro';

import { ERROR_MESSAGES, ZAP_MESSAGES, getZapImpact } from '@kyber/utils';

const FRIENDLY_ERROR_TRANSLATIONS: Record<string, () => string> = {
  [ERROR_MESSAGES.REFRESH_AND_RETRY]: () => t`An error occurred. Refresh the page and try again`,
  [ERROR_MESSAGES.REFRESH_PRICE_OR_SLIPPAGE]: () =>
    t`An error occurred. Try refreshing the price rate or increase max slippage`,
  [ERROR_MESSAGES.RPC_SETTINGS_ISSUE]: () =>
    t`An error occurred. Refresh the page and try again. If the issue still persists, it might be an issue with your RPC node settings in Metamask.`,
  [ERROR_MESSAGES.USER_REJECTED]: () => t`User rejected the transaction.`,
  [ERROR_MESSAGES.USER_REJECTED_REQUEST]: () => t`User rejected the request.`,
  [ERROR_MESSAGES.INCREASE_SLIPPAGE]: () => t`An error occurred. Please try increasing max slippage`,
  [ERROR_MESSAGES.INVALID_PERMIT_SIGNATURE]: () => t`An error occurred. Invalid Permit Signature`,
  [ERROR_MESSAGES.INSUFFICIENT_FEE_REWARDS]: () =>
    t`Insufficient fee rewards amount, try to remove your liquidity without claiming fees for now and you can try to claim it later`,
  [ERROR_MESSAGES.SOMETHING_WENT_WRONG]: () => t`Something went wrong. Please try again`,
  [ERROR_MESSAGES.GENERIC_ERROR]: () => t`An error occurred`,
};

const ZAP_MESSAGE_TRANSLATIONS: Record<string, () => string> = {
  [ZAP_MESSAGES.UNABLE_TO_CALCULATE]: () => t`Unable to calculate zap impact`,
  [ZAP_MESSAGES.ZAP_IMPACT_HIGH]: () =>
    t`Overall zap price impact is higher than expected. Click 'Zap Anyway' if you wish to proceed in Degen Mode.`,
  [ZAP_MESSAGES.ZAP_IMPACT_WARNING]: () => t`Overall zap price impact is higher than expected.`,
};

export const translateFriendlyErrorMessage = (message: string) => {
  const translator = FRIENDLY_ERROR_TRANSLATIONS[message];
  return translator ? translator() : message;
};

export const translateZapMessage = (message: string) => {
  const translator = ZAP_MESSAGE_TRANSLATIONS[message];
  if (translator) return translator();

  const poolMatch = message.match(/^(.*) Pool$/);
  if (poolMatch) {
    return t`${poolMatch[1]} Pool`;
  }

  return message;
};

export const translateZapImpact = (pi: number | null | undefined, suggestedSlippage: number) => {
  const result = getZapImpact(pi, suggestedSlippage);
  return {
    ...result,
    msg: translateZapMessage(result.msg),
  };
};
