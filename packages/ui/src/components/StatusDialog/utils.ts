import { StatusDialogType } from '@/components/StatusDialog';

export const getStatusText = (type: StatusDialogType) => {
  switch (type) {
    case StatusDialogType.WAITING:
      return 'Waiting for confirmation';
    case StatusDialogType.PROCESSING:
      return 'Processing transaction';
    case StatusDialogType.SUCCESS:
      return 'Transaction successful';
    case StatusDialogType.ERROR:
      return 'Transaction failed';
    default:
      return '';
  }
};

export const getStatusDescription = (type: StatusDialogType) => {
  switch (type) {
    case StatusDialogType.WAITING:
      return 'Confirm this transaction in your wallet';
    case StatusDialogType.PROCESSING:
      return 'Waiting for transaction to be mined';
    case StatusDialogType.SUCCESS:
      return 'Your transaction has been successful';
    case StatusDialogType.ERROR:
      return 'An error occurred while processing your transaction';
    default:
      return '';
  }
};
