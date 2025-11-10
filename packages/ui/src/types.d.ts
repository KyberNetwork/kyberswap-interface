declare module '*.png';

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}
declare module '*.svg?react' {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}
declare module '*.svg?url' {
  const src: string;
  export default src;
}

declare module '@lingui/react' {
  import type { I18n } from '@lingui/core';
  import type { ComponentType, ReactNode } from 'react';

  export function useLingui(): { i18n: I18n };

  export interface I18nProviderProps {
    i18n: I18n;
    children?: ReactNode;
  }

  export const I18nProvider: ComponentType<I18nProviderProps>;
}
