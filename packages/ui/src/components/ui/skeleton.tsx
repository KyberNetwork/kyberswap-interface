import { cn } from '@kyber/utils/tailwind-helpers';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className="ks-ui-style">
      <div
        className={cn(
          'relative isolate overflow-hidden rounded-md bg-layer2 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
          'ks-ui-style',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { Skeleton };
