import * as React from 'react';

import * as LabelPrimitive from '@radix-ui/react-label';
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@kyber/utils/tailwind-helpers';

const labelVariants = cva(
  'text-sm font-medium text-[#fafafa] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root className={cn(labelVariants(), 'ks-ui-style', className)} ref={ref} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
