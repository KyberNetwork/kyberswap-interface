declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}
declare module "*.svg?react" {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}
