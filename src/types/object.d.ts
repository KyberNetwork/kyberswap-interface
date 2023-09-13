interface ObjectConstructor {
  /**
   * Returns the names of the enumerable string properties and methods of an object.
   * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
   */
  keys<T extends string>(o: { [keys in T]: unknown }): T[]
}
