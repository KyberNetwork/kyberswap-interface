import { useLingui } from '@lingui/react';

import {
  MAX_SELECTED_OPTIONS,
  NON_FARMING_EXCLUDED_OPTIONS,
  conflictOptions,
  shareOptions,
} from '@/components/ShareModal/constants';
import { ShareOption, ShareType } from '@/components/ShareModal/types';
import { getShareOptionLabel } from '@/components/ShareModal/utils';
import { MouseoverTooltip } from '@/components/Tooltip';
import { Checkbox } from '@/components/ui/checkbox';

interface OptionsProps {
  type: ShareType;
  selectedOptions: Set<ShareOption>;
  setSelectedOptions: (options: Set<ShareOption>) => void;
  isFarming?: boolean;
}

export default function Options({ type, selectedOptions, setSelectedOptions, isFarming }: OptionsProps) {
  const { i18n } = useLingui();

  const handleOptionChange = (option: ShareOption, checked: boolean) => {
    const newSelectedOptions = new Set(selectedOptions);
    if (checked) {
      newSelectedOptions.add(option);
    } else {
      newSelectedOptions.delete(option);
    }

    const sortedOptions = new Set<ShareOption>();

    // Always add TOTAL_EARNINGS first if it exists in the selected options
    if (newSelectedOptions.has(ShareOption.TOTAL_EARNINGS)) {
      sortedOptions.add(ShareOption.TOTAL_EARNINGS);
    }

    // Add remaining options in the order they appear in shareOptions[type]
    const typeOptions = shareOptions[type];
    typeOptions.forEach(optionType => {
      if (newSelectedOptions.has(optionType) && optionType !== ShareOption.TOTAL_EARNINGS) {
        sortedOptions.add(optionType);
      }
    });

    setSelectedOptions(sortedOptions);
  };

  return (
    <div className="flex items-center justify-center flex-wrap gap-6 py-3">
      {shareOptions[type].map(option => {
        const isExcluded = !isFarming && NON_FARMING_EXCLUDED_OPTIONS.includes(option);
        const isMaxSelected = selectedOptions.size === MAX_SELECTED_OPTIONS && !selectedOptions.has(option);
        const isConflict = conflictOptions[type][option]?.some(o => selectedOptions.has(o));
        const isDisabled = isExcluded || isMaxSelected || isConflict;
        const conflictOptionLabels =
          conflictOptions[type][option]?.map(conflictOption => getShareOptionLabel(i18n, conflictOption)) ?? [];

        const message = isExcluded
          ? i18n._('This option is not available for non-farming pools')
          : isMaxSelected
            ? i18n._('You can only select up to {count} options', { count: MAX_SELECTED_OPTIONS })
            : isConflict && conflictOptionLabels.length > 0
              ? i18n._('This option is not available when you select {options}', {
                  options: conflictOptionLabels.join(', '),
                })
              : undefined;

        const optionLabel = getShareOptionLabel(i18n, option);

        return (
          <MouseoverTooltip text={message} placement="top" key={option}>
            <Checkbox
              label={optionLabel}
              disabled={isDisabled}
              checked={selectedOptions.has(option)}
              onChange={checked => handleOptionChange(option, checked)}
            />
          </MouseoverTooltip>
        );
      })}
    </div>
  );
}
