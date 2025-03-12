/// <reference types="vite/client" />

declare module "*.svg?react" {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}
