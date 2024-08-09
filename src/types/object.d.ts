interface ObjectConstructor {
  /**
   * Returns the names of the enumerable string properties and methods of an object.
   * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
   */
  keys<T extends string>(o: { [keys in T]: unknown }): T[]

  /**
   * Groups members of an iterable according to the return value of the passed callback.
   * @param items An iterable.
   * @param keySelector A callback which will be invoked for each item in items.
   */
  groupBy<K extends PropertyKey, T>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K,
  ): Partial<Record<K, T[]>>
}

interface MapConstructor {
  /**
   * Groups members of an iterable according to the return value of the passed callback.
   * @param items An iterable.
   * @param keySelector A callback which will be invoked for each item in items.
   */
  groupBy<K, T>(items: Iterable<T>, keySelector: (item: T, index: number) => K): Map<K, T[]>
}
