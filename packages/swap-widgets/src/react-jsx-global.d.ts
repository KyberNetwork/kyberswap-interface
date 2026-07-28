// styled-components v5's typings (@types/styled-components) reference the
// global `JSX` namespace, which @types/react v19 no longer declares (it lives
// at `React.JSX`). Without this alias the styled() prop inference collapses to
// `{}` and the DTS build fails. Remove once the package migrates off
// styled-components v5.
import type React from 'react'

declare global {
  namespace JSX {
    type ElementType = React.JSX.ElementType
    type Element = React.JSX.Element
    type ElementClass = React.JSX.ElementClass
    type ElementAttributesProperty = React.JSX.ElementAttributesProperty
    type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>
    type IntrinsicAttributes = React.JSX.IntrinsicAttributes
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>
    type IntrinsicElements = React.JSX.IntrinsicElements
  }
}
