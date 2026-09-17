weak let => nonisolated(unsafe) weak var 


 <!-- _____ -->

 I've analyzed the errors and the linked issue (expo/expo#50067). The root cause is that the `nonisolated(unsafe) let` locals you're using to smuggle call-scoped pointers into the `@JavaScriptActor` closures aren't honored by Swift 6.2.x's region-based isolation checker. The fix — confirmed by multiple commenters on the issue and the write-up at native-templates.com — is to wrap each pointer in the `@unchecked Sendable` box that already exists in your package: **`NonisolatedUnsafeVar`**, which you already use elsewhere in this same file (line ~517, for `callerRunLoop`).

> Wrapping those seven the same way, and reading `.value` at each use, clears them — no new type, no new safety argument beyond the one the existing comment already makes. 

Below are the three functions that need to change. The safety contract is unchanged: these are call-scoped inputs consumed synchronously inside `assumeIsolated`, and the `@unchecked Sendable` box simply expresses that to the compiler in a form Swift 6.2 also accepts.

---

### 1. `getter` inside `createHostObject` (line ~193)

**Before:**
```swift
func getter(
  context: UnsafeMutableRawPointer,
  propertyName: UnsafePointer<CChar>,
  resultPtr: UnsafeMutablePointer<facebook.jsi.Value>
) -> Bool {
  let propertyName = String(cString: propertyName)
  nonisolated(unsafe) let resultPtr = resultPtr

  return withGuaranteedContext(context) { (context: HostObjectContext, runtime) in
    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        try context.get(propertyName).writeJSIValue(to: resultPtr)
      }
    }
  }
}
```

**After:**
```swift
func getter(
  context: UnsafeMutableRawPointer,
  propertyName: UnsafePointer<CChar>,
  resultPtr: UnsafeMutablePointer<facebook.jsi.Value>
) -> Bool {
  let propertyName = String(cString: propertyName)
  let resultPtr = NonisolatedUnsafeVar(resultPtr)

  return withGuaranteedContext(context) { (context: HostObjectContext, runtime) in
    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        try context.get(propertyName).writeJSIValue(to: resultPtr.value)
      }
    }
  }
}
```

---

### 2. `createFunctionClosure` for `SyncFunctionClosure` (lines ~786–789)

**Before:**
```swift
func call(
  context: UnsafeMutableRawPointer,
  thisPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsCount: Int,
  resultPtr: UnsafeMutablePointer<facebook.jsi.Value>
) -> Bool {
  // ...
  nonisolated(unsafe) let thisPtr = thisPtr
  nonisolated(unsafe) let argumentsPtr = argumentsPtr
  nonisolated(unsafe) let resultPtr = resultPtr

  return withGuaranteedContext(context) { (context: HostFunctionContext, runtime) in
    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        let this = UnsafeMutablePointer(mutating: thisPtr).move()
        let arguments = JavaScriptValuesBuffer(runtime, start: argumentsPtr, count: argumentsCount)
        let thisValue = JavaScriptValue(runtime, this)
        try context.call(thisValue, consume arguments).writeJSIValue(to: resultPtr)
      }
    }
  }
}
```

**After:**
```swift
func call(
  context: UnsafeMutableRawPointer,
  thisPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsCount: Int,
  resultPtr: UnsafeMutablePointer<facebook.jsi.Value>
) -> Bool {
  // ...
  let thisPtr = NonisolatedUnsafeVar(thisPtr)
  let argumentsPtr = NonisolatedUnsafeVar(argumentsPtr)
  let resultPtr = NonisolatedUnsafeVar(resultPtr)

  return withGuaranteedContext(context) { (context: HostFunctionContext, runtime) in
    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        let this = UnsafeMutablePointer(mutating: thisPtr.value).move()
        let arguments = JavaScriptValuesBuffer(runtime, start: argumentsPtr.value, count: argumentsCount)
        let thisValue = JavaScriptValue(runtime, this)
        try context.call(thisValue, consume arguments).writeJSIValue(to: resultPtr.value)
      }
    }
  }
}
```

---

### 3. `createFunctionClosure` for `UnownedThisSyncFunctionClosure` (lines ~829–831)

**Before:**
```swift
func call(
  context: UnsafeMutableRawPointer,
  thisPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsCount: Int,
  resultPtr: UnsafeMutablePointer<facebook.jsi.Value>
) -> Bool {
  // ...
  nonisolated(unsafe) let thisPtr = thisPtr
  nonisolated(unsafe) let argumentsPtr = argumentsPtr
  nonisolated(unsafe) let resultPtr = resultPtr

  return withGuaranteedContext(context) { (context: UnownedThisHostFunctionContext, runtime) in
    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        let arguments = JavaScriptValuesBuffer(runtime, start: argumentsPtr, count: argumentsCount)
        let thisValue = JavaScriptUnownedValue(runtime.pointee, thisPtr)
        try context.call(thisValue, consume arguments).writeJSIValue(to: resultPtr)
      }
    }
  }
}
```

**After:**
```swift
func call(
  context: UnsafeMutableRawPointer,
  thisPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsPtr: UnsafePointer<facebook.jsi.Value>,
  argumentsCount: Int,
  resultPtr: UnsafeMutablePointer<facebook.jsi.Value>
) -> Bool {
  // ...
  let thisPtr = NonisolatedUnsafeVar(thisPtr)
  let argumentsPtr = NonisolatedUnsafeVar(argumentsPtr)
  let resultPtr = NonisolatedUnsafeVar(resultPtr)

  return withGuaranteedContext(context) { (context: UnownedThisHostFunctionContext, runtime) in
    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        let arguments = JavaScriptValuesBuffer(runtime, start: argumentsPtr.value, count: argumentsCount)
        let thisValue = JavaScriptUnownedValue(runtime.pointee, thisPtr.value)
        try context.call(thisValue, consume arguments).writeJSIValue(to: resultPtr.value)
      }
    }
  }
}
```

---

## Why this works

`NonisolatedUnsafeVar` is an `@unchecked Sendable` wrapper. Swift's region-based isolation checker treats `Sendable` values as safe to cross isolation boundaries, so it stops flagging the pointer captures as "sending" risks. The actual runtime behavior is identical — the pointers are still consumed synchronously inside the `assumeIsolated` closure, exactly as the existing comments in your file describe. No heap allocations are introduced on the hot path beyond what the compiler already does for the wrapper (which the existing `NonisolatedUnsafeVar` usage in `execute()` already accepted).

## Persisting the fix

Since you're editing a file under `node_modules/expo-modules-jsi/`, the change will be wiped on the next `npm install`. Use **`patch-package`** to make it stick:

1. `npm install --save-dev patch-package`
2. Add `"postinstall": "patch-package"` to your `package.json` scripts.
3. After editing the file, run `npx patch-package expo-modules-jsi`.

This generates `patches/expo-modules-jsi+57.1.0.patch` (or whatever version you have installed), which reapplies automatically on every install. Once Expo ships an upstream fix, `patch-package` will warn that the patch no longer matches, and you can delete it. 