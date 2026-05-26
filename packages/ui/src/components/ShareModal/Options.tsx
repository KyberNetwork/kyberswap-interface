import { useLingui } from '@lingui/react';

import { MAX_SELECTED_OPTIONS, conflictOptions, shareOptions } from '@/components/ShareModal/constants';
import { ShareModalProps, ShareOption, ShareType } from '@/components/ShareModal/types';
import { getShareOptionLabel, getValueByOption } from '@/components/ShareModal/utils';
import { MouseoverTooltip } from '@/components/Tooltip';
import { Checkbox } from '@/components/ui/checkbox';

interface OptionsProps {
  type: ShareType;
  selectedOptions: Set<ShareOption>;
  setSelectedOptions: (options: Set<ShareOption>) => void;
  isFarming?: boolean;
  hasActiveApr?: boolean;
  pool?: ShareModalProps['pool'];
  position?: ShareModalProps['position'];
  reward?: ShareModalProps['reward'];
}

export default function Options({
  type,
  selectedOptions,
  setSelectedOptions,
  hasActiveApr,
  pool,
  position,
  reward,
}: OptionsProps) {
  const { i18n } = useLingui();

  const handleOptionChange = (option: ShareOption, checked: boolean) => {
    const newSelectedOptions = new Set(selectedOptions);

    if (!checked) {
      newSelectedOptions.delete(option);
      setSelectedOptions(newSelectedOptions);
      return;
    }

    conflictOptions[type][option]?.forEach(conflictOption => {
      newSelectedOptions.delete(conflictOption);
    });

    newSelectedOptions.delete(option);
    newSelectedOptions.add(option);

    while (newSelectedOptions.size > MAX_SELECTED_OPTIONS) {
      const oldestOption = newSelectedOptions.values().next().value;
      if (oldestOption) {
        newSelectedOptions.delete(oldestOption);
      }
    }

    setSelectedOptions(newSelectedOptions);
  };

  const visibleOptions = shareOptions[type].filter(option => option !== ShareOption.ACTIVE_APR || hasActiveApr);

  return (
    <div className="flex items-center justify-center flex-wrap gap-6 py-3">
      {visibleOptions.map(option => {
        const optionLabel = getShareOptionLabel(i18n, option);
        const optionValue = getValueByOption({ type, option, selectedOptions, pool, position, reward });

        return (
          <MouseoverTooltip key={option} text={`${optionLabel}: ${optionValue}`} placement="top">
            <Checkbox
              label={optionLabel}
              checked={selectedOptions.has(option)}
              onChange={checked => handleOptionChange(option, checked)}
            />
          </MouseoverTooltip>
        );
      })}
    </div>
  );
}
