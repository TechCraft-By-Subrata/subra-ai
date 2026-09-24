# Chapter 20 — Truthy/Falsy Gotchas That Break RN Conditionals

📘 Concept · 🧠 Quiz · ⏱ 6 min · Module 4: JS Patterns Native Devs Must Know

---

## 🎯 What You'll Learn

- What JavaScript considers truthy and falsy
- Why `&&` conditional rendering behaves differently in React Native vs the web
- The specific values that silently break your UI
- How to write conditional JSX that actually does what you expect

---

## 🧩 Why This Matters in React Native

Conditional rendering is everywhere in RN — show a loader while fetching, hide a button when a list is empty, render a badge only when count is non-zero. The `&&` shorthand feels natural and clean.

But there are a handful of falsy values in JavaScript that don't behave the way React Native expects — and instead of hiding your component, they **render visible garbage on screen**.

This is one of the most common bugs beginners ship to production without realising it.

---

## 🔢 JavaScript's Falsy Values

JavaScript treats these **eight values** as falsy — everything else is truthy:

| Value | Type |
|---|---|
| `false` | Boolean |
| `0` | Number |
| `-0` | Number |
| `0n` | BigInt |
| `""` | String (empty) |
| `null` | Null |
| `undefined` | Undefined |
| `NaN` | Number |

Everything else — including `[]`, `{}`, `"0"`, and `"false"` — is **truthy**.

```js
Boolean(0)         // false
Boolean("")        // false
Boolean(null)      // false
Boolean([])        // true  ← surprises people
Boolean({})        // true  ← surprises people
Boolean("false")   // true  ← it's a non-empty string!
```

---

## 💥 The Classic RN Bug

Here's the bug you will hit (or have already hit):

```jsx
// ❌ Renders a "0" on screen when items.length is 0
<View>
  {items.length && <ItemList items={items} />}
</View>
```

**Why?** When `items.length` is `0`, JavaScript short-circuits and returns `0` — not `false`, not `null`, but the **number `0`**. React Native sees a number and renders it as text: a lonely `0` floating in your UI.

On the web this is less visible (React DOM ignores `0` in some contexts), but **React Native will render it**.

```jsx
// ✅ Fix 1: Convert to boolean explicitly
{items.length > 0 && <ItemList items={items} />}

// ✅ Fix 2: Use !! to coerce to boolean
{!!items.length && <ItemList items={items} />}

// ✅ Fix 3: Ternary — most explicit, always safe
{items.length > 0 ? <ItemList items={items} /> : null}
```

---

## 🗺️ All the Ways Conditional Rendering Can Go Wrong

### Case 1: Count-based conditions

```jsx
const messageCount = 0;

// ❌ Renders "0" on screen
{messageCount && <Badge count={messageCount} />}

// ✅ Safe
{messageCount > 0 && <Badge count={messageCount} />}
```

### Case 2: String-based conditions

```jsx
const username = "";

// ❌ Renders nothing (falsy), but silently — might hide content you wanted
{username && <Text>{username}</Text>}

// ✅ Explicit intent
{username.length > 0 && <Text>{username}</Text>}
```

### Case 3: `NaN` from a failed parse

```jsx
const price = parseFloat("not-a-number"); // NaN

// ❌ Renders nothing — NaN is falsy, but is that what you meant?
{price && <Text>${price}</Text>}

// ✅ Guard with isNaN
{!isNaN(price) && <Text>${price}</Text>}
```

### Case 4: `undefined` from an optional prop

```jsx
// ❌ Crashes if onPress is never passed and you call it
{onPress && <Button onPress={onPress} />}
// This one is actually safe — undefined IS falsy and returns nothing ✅

// But this is NOT safe:
<Button onPress={onPress} />
// If onPress is undefined and Button calls it internally → crash
```

> 💡 `null` and `undefined` are the **safe** falsy values for conditional rendering — React Native renders nothing for both. `0`, `NaN`, and `""` are the **dangerous** ones.

---

## ✅ The Safe Falsy Values vs The Dangerous Ones

| Value | What RN renders | Safe for `&&`? |
|---|---|---|
| `false` | Nothing | ✅ Yes |
| `null` | Nothing | ✅ Yes |
| `undefined` | Nothing | ✅ Yes |
| `0` | Renders `"0"` as text | ❌ No |
| `NaN` | Renders `"NaN"` as text | ❌ No |
| `""` | Renders nothing, but silently | ⚠️ Depends |

---

## 🔍 Real RN Codebase Patterns

```jsx
// Cart badge — classic count bug
{cartCount > 0 && (
  <View style={styles.badge}>
    <Text>{cartCount}</Text>
  </View>
)}

// Loading state
{isLoading ? <ActivityIndicator /> : <ContentView />}

// Optional error message
{errorMessage ? (
  <Text style={styles.error}>{errorMessage}</Text>
) : null}

// Feature flag
{featureFlags.showBeta && <BetaFeature />}
// Safe — featureFlags.showBeta is a boolean

// API data guard
{data?.user && <ProfileCard user={data.user} />}
// Safe — object is truthy, undefined is falsy
```

---

## 🧠 Mental Model

Think of `&&` in JSX as: **"return the right side if the left side is truthy, otherwise return the left side as-is."**

That last part — *return the left side as-is* — is the gotcha. If the left side is `0`, React Native gets `0` and renders it. If it's `false`, `null`, or `undefined`, React Native renders nothing.

So ask yourself: **"If this condition is false, what does `&&` actually return?"**

- `0 && <X />` → returns `0` → renders `"0"` 💥
- `false && <X />` → returns `false` → renders nothing ✅
- `null && <X />` → returns `null` → renders nothing ✅

When in doubt, use `condition > 0`, `Boolean(condition)`, `!!condition`, or a ternary.

---

## 🧠 Quiz

**Q1.** What does this render when `notifications` is `0`?
```jsx
<Text>You have {notifications && "new notifications"}</Text>
```
<details>
<summary>See answer</summary>

It renders: **"You have 0"** — because `0` is falsy, so `&&` returns `0` itself, and React Native renders it as text inside `<Text>`.

Fix: `{notifications > 0 && "new notifications"}`

</details>

---

**Q2.** Which of these is safe and which will render unexpected output?
```jsx
// A
{undefined && <View />}

// B
{0 && <View />}

// C
{null && <View />}

// D
{NaN && <View />}
```
<details>
<summary>See answer</summary>

- **A** — ✅ Safe. `undefined` renders nothing.
- **B** — ❌ Unsafe. Renders `"0"` on screen.
- **C** — ✅ Safe. `null` renders nothing.
- **D** — ❌ Unsafe. Renders `"NaN"` on screen.

</details>

---

**Q3.** Fix this component:
```jsx
function UnreadBanner({ count }) {
  return (
    <View>
      {count && (
        <Text>{count} unread messages</Text>
      )}
    </View>
  );
}
```
<details>
<summary>See answer</summary>

```jsx
function UnreadBanner({ count }) {
  return (
    <View>
      {count > 0 && (
        <Text>{count} unread messages</Text>
      )}
    </View>
  );
}
```

When `count` is `0`, the original renders `"0"` on screen. The fix converts to a proper boolean comparison.

</details>

---

## 🏋️ Try It Yourself

You have this component:

```jsx
function ProductCard({ price, stockCount, discount }) {
  return (
    <View>
      <Text>${price}</Text>
      {stockCount && <Text>In Stock</Text>}
      {discount && <Text>{discount}% off</Text>}
    </View>
  );
}
```

It's called with: `<ProductCard price={9.99} stockCount={0} discount={0} />`

1. What does it render right now? What's wrong with it?
2. Fix both conditional renders so they behave correctly.
3. Bonus: what if `price` could be `0`? How would you guard that too?

---

## ⏭️ Up Next

**Chapter 21** — Nullish coalescing (`??`) vs OR (`||`) — safe defaults 🏋️

You'll learn why using `||` for default values can accidentally swallow valid `0`s and empty strings — and how `??` solves it cleanly.

---

*Part of [JavaScript Essentials for React Native](https://github.com/TechCraft-By-Subrata/java-script-essentials-for-react-native-developers) · Built by [React Native Mastery](https://rnm.subraatakumar.com)*
