import FullRangeWarning from '@/components/Warning/FullRangeWarning';
import OutRangeWarning from '@/components/Warning/OutRangeWarning';

export default function Warning() {
  return (
    <div className="flex flex-col gap-2">
      <OutRangeWarning />
      <FullRangeWarning />
    </div>
  );
}
