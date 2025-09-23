import FullRangeWarning from '@/components/Warning/FullRangeWarning';
import OutRangeWarning from '@/components/Warning/OutRangeWarning';
import SlippageWarning from '@/components/Warning/SlippageWarning';
import ZapImpactWarning from '@/components/Warning/ZapImpactWarning';

export default function Warning() {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <ZapImpactWarning />
      <SlippageWarning />
      <OutRangeWarning />
      <FullRangeWarning />
    </div>
  );
}
