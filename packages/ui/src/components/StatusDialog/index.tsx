import ArrowUpRightIcon from '@/assets/icons/ic-arrow-up-right.svg?react';
import ErrorDetailIcon from '@/assets/icons/ic-error-detail.svg?react';
import ErrorIcon from '@/assets/icons/ic-error.svg?react';
import SuccessIcon from '@/assets/icons/ic-success.svg?react';
import { getStatusDescription, getStatusText } from '@/components/StatusDialog/utils';
import Loading from '@/components/loading';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';

export enum StatusDialogType {
  WAITING = 'WAITING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface StatusDialogProps {
  type: StatusDialogType;
  title?: string;
  description?: string;
  transactionExplorerUrl?: string;
  errorMessage?: string;
  action?: React.ReactNode;
  onClose: () => void;
}

export default function StatusDialog({
  type,
  title,
  description,
  transactionExplorerUrl,
  errorMessage,
  action,
  onClose,
}: StatusDialogProps) {
  const statusIcon =
    type === StatusDialogType.SUCCESS ? (
      <SuccessIcon className="w-6 h-6" />
    ) : type === StatusDialogType.ERROR ? (
      <ErrorIcon className="w-6 h-6" />
    ) : (
      <Loading className="w-6 h-6 text-accent" />
    );

  const statusText = title === undefined ? getStatusText(type) : title;
  const statusDescription = description === undefined ? getStatusDescription(type) : description;

  return (
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent
        containerClassName="ks-ui-style"
        className="bg-layer1 p-6 max-w-[420px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="hidden" />
        <div className="text-sm text-muted-foreground">
          <div className="w-full flex items-center justify-center gap-2 py-4">
            {statusIcon}
            <div className="text-xl font-medium text-center">{statusText}</div>
          </div>

          {statusDescription ? <div className="text-sm text-subText text-center py-2">{statusDescription}</div> : null}

          {transactionExplorerUrl ? (
            <div className="flex w-full justify-center">
              <a
                className="flex items-center w-fit text-accent text-sm gap-[2px] py-2 pt-1"
                href={transactionExplorerUrl}
                target="_blank"
                rel="noopener norefferer noreferrer"
              >
                <span>View transaction</span>
                <ArrowUpRightIcon className="w-4 h-4" />
              </a>
            </div>
          ) : null}

          {errorMessage && type === StatusDialogType.ERROR ? (
            <div className="flex items-start gap-[6px] px-3 py-2 rounded-[24px] mt-3 mb-1 bg-[#e42f5933] w-full">
              <ErrorDetailIcon className="w-4 h-4 relative top-[2px]" />
              <span className="text-sm" style={{ maxWidth: 'calc(100% - 22px)' }}>
                {errorMessage}
              </span>
            </div>
          ) : null}
        </div>

        {action ? <DialogFooter className="sm:space-x-4">{action}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
