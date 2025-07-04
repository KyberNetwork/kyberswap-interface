export const enumToArrayOfValues = (enumObject: { [x: string]: unknown }, valueType?: string) =>
  Object.keys(enumObject)
    .map(key => enumObject[key])
    .filter(value => !valueType || typeof value === valueType);
