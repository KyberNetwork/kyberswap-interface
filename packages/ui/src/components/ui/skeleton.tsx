import { cn } from "@kyber/utils/tailwind-helpers";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-layer2", className)}
      {...props}
    />
  );
}

export { Skeleton };
