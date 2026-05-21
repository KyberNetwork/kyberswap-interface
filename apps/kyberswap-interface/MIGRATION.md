# styled-components → Tailwind Migration Guide

Patterns and conventions for migrating this app from `styled-components` to Tailwind CSS. Keep it short; link to a reference component per pattern.

**Reference components** (Phase 3 batch 1 + 2):

- Simple wrapper variants: [src/components/Card/index.tsx](./src/components/Card/index.tsx) (5 variants as separate exports)
- Trivial styled div: [src/components/Divider/index.tsx](./src/components/Divider/index.tsx)
- Keyframes (content swap): [src/components/Dots.tsx](./src/components/Dots.tsx) + `.animate-ellipsis` in [src/tailwind.css](./src/tailwind.css)
- SVG + keyframes (rotation): [src/components/Loader/index.tsx](./src/components/Loader/index.tsx)
- Complex nested animation: [src/components/Loader/AnimatedLoader.tsx](./src/components/Loader/AnimatedLoader.tsx)
- `cva` variant component: [src/components/Badge/index.tsx](./src/components/Badge/index.tsx)

## Golden rules

1. **Use theme tokens, never hex** — `bg-primary`, not `bg-[#31cb9e]`. New colors must be added to [src/tailwind.css](./src/tailwind.css) + [tailwind.config.ts](./tailwind.config.ts).
2. **Class order is auto-sorted** by `prettier-plugin-tailwindcss`. Don't manually order.
3. **Conditional classes** go through `cn(...)` so `tailwind-merge` resolves conflicts.
4. **Variants** use `cva` (multiple combining axes) OR separate sub-components (small, independent set).
5. **Breakpoints**: `sm/md/lg/xl/2xl` map to `MEDIA_WIDTHS` (768/992/1200/1400/1800). Use `max-sm:`, `max-md:`, etc. when porting `mediaWidth.upToX`.
6. **Animations**: keyframes that fit `transform`/`opacity` → `tailwind.config.ts` `extend.keyframes` + `extend.animation`. Anything needing custom selectors/`::after`/`content` swap → `@layer components` in [src/tailwind.css](./src/tailwind.css).

## Patterns

### 1. Plain styled component → div + className

```tsx
// Before
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.buttonBlack};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
`

// After
<div className="flex items-center gap-2 rounded-lg border border-border bg-buttonBlack px-4 py-3">
  ...
</div>
```

### 2. Variant component — separate exports

For 3–6 independent variants (no combinatorial axes), separate exports stay clearer than `cva`. See [Card](./src/components/Card/index.tsx):

```tsx
const base = 'w-full rounded-[20px] p-5'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn(base, className)} {...rest} />
))

export const BlackCard = forwardRef(...)
export const LightCard = forwardRef(...)
// etc.
```

### 3. Variant component — `cva` (enum)

For variant + size/intent combinations or when consumers pass a single `variant` prop, use `cva`. See [Badge](./src/components/Badge/index.tsx):

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

export enum BadgeVariant { NEGATIVE = 'NEGATIVE', ... }

const badge = cva('inline-flex items-center justify-center rounded-full px-2 py-1 font-medium', {
  variants: {
    variant: {
      [BadgeVariant.NEGATIVE]: 'bg-red-20 text-red',
      [BadgeVariant.POSITIVE]: 'bg-green1 text-white',
      ...
    },
  },
})

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badge>

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ variant, className, ...rest }, ref) => (
  <div ref={ref} className={cn(badge({ variant }), className)} {...rest} />
))
```

Enum values double as cva keys via computed property syntax `[BadgeVariant.X]: '...'`. Consumers writing `<Badge variant={BadgeVariant.NEGATIVE}>` keep working.

### 4. Dynamic value (computed at runtime) → `style` prop or CSS variables

```tsx
// Before
const Bar = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}%;
`

// After — inline style for one-off
<div className="bg-primary" style={{ width: `${width}%` }} />
```

For multiple related dynamic values, use CSS custom properties on the parent and reference them in children's `style` (see [AnimatedLoader](./src/components/Loader/AnimatedLoader.tsx) `--dot-size`, `--dot-shadow`, etc.).

### 5. Media queries → responsive prefixes

```tsx
// Before
const Box = styled.div`
  padding: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px;
  `}
`

// After
<div className="p-6 max-sm:p-3" />
```

### 6. Keyframes — `transform`/`opacity` → tailwind config

For simple, reusable rotations/translates that fit the `transform` model, add them to [tailwind.config.ts](./tailwind.config.ts) `extend.keyframes` + `extend.animation`:

```ts
animation: {
  'spin-slow': 'spin 2s linear infinite',
  'spin-slow-reverse': 'spin 2s linear infinite reverse',
},
```

Then: `<svg className="animate-spin-slow" />`.

### 7. Keyframes — custom selectors / content swap → tailwind.css

When keyframes need `::after`, `content` mutation, or complex selectors, declare them under `@layer components` in [src/tailwind.css](./src/tailwind.css):

```css
@layer components {
  .animate-ellipsis::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% { content: '.'; }
    33% { content: '..'; }
    66% { content: '...'; }
  }
}
```

Then use the class name directly: `<span className="animate-ellipsis" />`. See [Dots](./src/components/Dots.tsx).

### 8. Pseudo-elements & nested-selector styles → arbitrary variants

```tsx
// Before
const Card = styled.div`
  &:hover { background: ${({ theme }) => theme.tabActive}; }
  &::before { content: ''; ... }
  & > svg { color: ${({ theme }) => theme.primary}; }
`

// After
<div className="hover:bg-tabActive before:content-[''] [&>svg]:text-primary" />
```

### 9. Extending a 3rd-party component

```tsx
// Before
import { Link } from 'react-router-dom'
const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.primary};
`

// After — pass className directly
<Link to="/x" className="text-primary hover:brightness-110" />
```

### 10. Replacing `TYPE.*` helpers

```tsx
// Before
<TYPE.subHeader color="subText">Hello</TYPE.subHeader>

// After
<div className="text-sm font-normal text-subText">Hello</div>
```

## Things to drop while migrating

- `useTheme()` — read CSS vars directly (`var(--ks-primary)`) or pass classes. Only drop if no other line in the file uses it.
- `Rebass` `Box`/`Flex`/`Text` — replace with `<div>` + flex utilities.
- `polished` `lighten/darken/rgba/transparentize/readableColor` — use Tailwind `brightness-*`/`opacity-*` or define a new token (see below).
- `${({ theme }) => theme.flexRowNoWrap}` snippets — `flex flex-nowrap`.

## Adding a new token

1. Add CSS variable to [src/tailwind.css](./src/tailwind.css) under `:root`.
2. Map it in [tailwind.config.ts](./tailwind.config.ts) `theme.extend.colors` (or `backgroundImage`, `boxShadow`, etc.).
3. Reference in code as `bg-yourtoken`, `text-yourtoken`, ...

For alpha-blended tokens (e.g. `bg-warning/25`), declare as an object map:

```ts
warning: {
  DEFAULT: 'var(--ks-warning)',
  20: 'var(--ks-warning-20)',
  25: 'var(--ks-warning-25)',
}
```

This gives `bg-warning`, `bg-warning-20`, `bg-warning-25`. Used in Card (`bg-warning-25` for `WarningCard`) and Badge (`bg-warning-20` / `bg-red-20` / `bg-primary-20` for soft variants — replacing `theme.X + '33'` from polished).

## Findings from the pilot batches

1. **Drop dynamic CSS-string props** (`padding`, `margin`, `borderRadius`, `border`, `backgroundColor`). Push them out to `className` (preferred) or `style={{...}}` (only when truly runtime-dynamic). Don't recreate the rebass styled-system on top of Tailwind.

2. **Forward `className` and spread HTML attributes** on the root element so existing `styled(MyComponent)` wrappers keep working — they generate a class and pass it via `className`. Migrate the inner primitive first; wrappers can follow.

3. **`styled(Card)` wrappers using rebass props on the call site break TS** when you drop the rebass prop types from the inner component. Fix at the call site (`className="rounded-[20px]"`), not by re-adding props.

4. **rebass `m`/`mt`/`marginTop`/`padding`/`sx` shorthands** map cleanly:
   - `m="20px 0 0"` → `mt-5`
   - `marginTop="1rem"` → `mt-4`
   - `padding="2rem"` → `p-8`
   - `padding="45px 10px"` → `px-2.5 py-[45px]`
   - `borderRadius="1rem"` → `rounded-2xl`
   - `borderRadius="20px"` → `rounded-[20px]`
   - `sx={{ marginTop: '20px' }}` → `className="mt-5"`
   - `marginX="-1rem"` → `className="-mx-4"`

5. **`polished.rgba(theme.X, 0.25)` / `theme.X + '33'`** — add an alpha-blended token instead of inlining `rgba(...)` or hex+alpha.

6. **`polished.readableColor`** — pick the contrast color explicitly per case (`text-white` for dark backgrounds, `text-textReverse` for green/primary). The function is unnecessary when you know each variant's bg.

7. **Don't remove `useTheme()` opportunistically** — only when the touched code no longer needs it.

8. **Variant components vs `cva`** — separate exports for 4–5 simple, distinct variants (Card). `cva` when consumers pass a single variant prop and variants might combine with sizes/intents/states (Badge, future Button).

9. **CSS variables on a parent + style refs on children** beats per-element interpolation for animations with many `size`-derived measurements (AnimatedLoader pattern).

10. **SVG components** — replace `styled.svg` with plain `<svg>` + `className` for the animation, and inline `stroke` directly on `<path>`.

## Per-folder lint enforcement

When a folder is fully migrated, append its glob to `overrides[0].files` in [.eslintrc.js](./.eslintrc.js). This activates `no-restricted-imports` for `styled-components` / `rebass` / `polished` in that folder so regressions are blocked.

## Pre-PR checklist

- [ ] No `styled-components`, `rebass`, `polished` import remains in the touched files
- [ ] No `TYPE.*` left in the touched files (clean up if file is fully migrated)
- [ ] `pnpm lint` clean
- [ ] `pnpm type-check` clean
- [ ] Visual smoke test: golden path + edge cases (loading, error, mobile breakpoint)
- [ ] No arbitrary hex values like `bg-[#xxx]` — use a token
- [ ] Lint guardrail glob updated to include the migrated folder
