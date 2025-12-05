import { Trans } from '@lingui/macro';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function LeftWarning() {
  const { theme } = useWidgetStore(['theme']);

  return (
    <>
      <div className="py-2 px-4 text-sm rounded-md text-blue mt-4" style={{ backgroundColor: `${theme.blue}33` }}>
        <Trans>This pool doesn't exist yet. You will initialize it.</Trans>
      </div>
    </>
  );
}
