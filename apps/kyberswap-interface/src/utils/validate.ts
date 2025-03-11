/* eslint-disable @typescript-eslint/ban-ts-comment */

type GuardedType<T> = T extends (x: any) => x is infer U ? U : never

function isNull(input: unknown): input is null | undefined {
  if (input === undefined) return true
  if (input === null) return true
  return false
}
export function isNumber(input: unknown): input is number {
  return typeof input === 'number'
}

export function isBoolean(input: unknown | any): input is boolean {
  return typeof input === 'boolean'
}

export function isString(input: unknown): input is string {
  return typeof input === 'string'
}

// @ts-ignore
export function isArray<T extends VerifierTypes>(elementVerifier: T): (input: unknown) => input is GuardedType<T>[] {
  return (input: unknown): input is GuardedType<T>[] => {
    if (!Array.isArray(input)) return false
    // @ts-ignore
    return input.every(elementVerifier)
  }
}

export function isStruct<T extends { [key: string]: VerifierTypes }, U extends keyof T>(
  struct: T,
): (input: unknown) => input is { readonly [keys in U]: GuardedType<T[keys]> } {
  const verifiers = Object.entries(struct)

  return (input: unknown): input is { [keys in U]: GuardedType<T[keys]> } => {
    if (typeof input !== 'object') return false
    if (isNull(input)) return false
    return verifiers.every(([key, verify]) => verify((input as Record<string, any>)[key]))
  }
}

// @ts-ignore
type VerifierTypes =
  | typeof isString
  | typeof isNumber
  | typeof isBoolean
  | ReturnType<typeof isArray>
  | ReturnType<typeof isStruct>

/**
 * Use for fields that acceptable to be `undefined` or `null`
 *
 * Do not use this for fields expected to be non-null to be run correctly, e.g: `response.data`
 *
 * If you are using nesting, it's likely you've used it incorrectly.
 */
export function isNullable<T extends VerifierTypes>(
  verifier: T,
): (input: unknown) => input is null | undefined | GuardedType<T> {
  return (input: unknown): input is null | undefined | GuardedType<T> => {
    if (input === undefined) return true
    if (input === null) return true
    return verifier(input)
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const ValidateBalanceExample = isArray(
  isStruct({
    result: isNullable(isArray(isString)),
  }),
)
const ValidateComplexResponseExample = isStruct({
  data: isStruct({
    wallets: isArray(
      isStruct({
        address: isString,
        ens: isNullable(isString),
        ETH: isNumber,
        reward: isNullable(isNumber),
        txs: isArray(isStruct({ id: isString })),
        balances: isNullable(ValidateBalanceExample),
      }),
    ),
    pagination: isStruct({
      pagination: isNumber,
      totalItems: isNumber,
    }),
  }),
})
type ExtractedBalances = GuardedType<typeof ValidateBalanceExample>

let complexResponseExample: any
if (ValidateComplexResponseExample(complexResponseExample)) {
  // `complexResponseExample` has been generated type now. You can try:
  type Wallets = typeof complexResponseExample.data.wallets
  const balance: ExtractedBalances | null | undefined = complexResponseExample.data.wallets[0].balances
} else {
  // complexResponseExample is unknown type
  complexResponseExample
}
/* eslint-enable @typescript-eslint/no-unused-vars */
