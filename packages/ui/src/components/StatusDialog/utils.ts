import type { I18n } from '@lingui/core';

import { StatusDialogType } from '@/components/StatusDialog';

export const getStatusText = (i18n: I18n, type: StatusDialogType) => {
  switch (type) {
    case StatusDialogType.WAITING:
      return i18n._('Waiting for confirmation');
    case StatusDialogType.PROCESSING:
      return i18n._('Processing transaction');
    case StatusDialogType.SUCCESS:
      return i18n._('Transaction successful');
    case StatusDialogType.ERROR:
      return i18n._('Transaction failed');
    default:
      return '';
  }
};

export const getStatusDescription = (i18n: I18n, type: StatusDialogType) => {
  switch (type) {
    case StatusDialogType.WAITING:
      return i18n._('Confirm this transaction in your wallet');
    case StatusDialogType.PROCESSING:
      return i18n._('Waiting for transaction to be mined');
    case StatusDialogType.SUCCESS:
      return i18n._('Your transaction has been successful');
    case StatusDialogType.ERROR:
      return i18n._('An error occurred while processing your transaction');
    default:
      return '';
  }
};
