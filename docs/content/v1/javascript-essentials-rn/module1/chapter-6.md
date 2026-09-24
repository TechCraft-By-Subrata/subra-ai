# Chapter 6 — Short-Circuit Evaluation & Optional Chaining (`?.`) in RN

> **Module 1 · Lesson 6 of 7** | 📘 Concept · 🎬 Demo | ⏱ 7 min

---

## What You'll Learn

- How `&&` and `||` short-circuit instead of just returning booleans
- The most common RN bug pattern this fixes — and the one it can cause
- Optional chaining (`?.`) for safely reading deep, possibly-missing properties
- Nullish coalescing (`??`) vs `||` — and why the difference matters for real data

---

## Short-Circuit Evaluation: `&&` and `||` Aren't Just for Booleans

In JavaScript, `&&` and `||` don't evaluate to `true`/`false`. They return one of the actual operand values.

```js
console.log(true && "hello");   // "hello"
console.log(false && "hello");  // false
console.log(null || "default"); // "default"
console.log("value" || "default"); // "value"
```

**`&&` rule:** if the left side is falsy, return it immediately and stop. Otherwise, return the right side.

**`||` rule:** if the left side is truthy, return it immediately and stop. Otherwise, return the right side.

"Short-circuit" means JS doesn't even evaluate the right side if the left side already determines the outcome.

---

## The RN Pattern: Conditional Rendering with `&&`

This is the single most common use of `&&` in React Native:

```jsx
const NotificationBanner = ({ unreadCount }) => (
  <View>
    {unreadCount > 0 && (
      <Text>{`You have ${unreadCount} new notifications`}</Text>
    )}
  </View>
);
```

If `unreadCount > 0` is `false`, the expression short-circuits and returns `false`. React renders nothing for `false`, `null`, or `undefined` — so the `<Text>` simply doesn't appear.

If `unreadCount > 0` is `true`, the expression evaluates to the JSX on the right, and React renders it.

---

## The Bug This Pattern Causes — `0` Renders Literally

```jsx
// ❌ Dangerous when unreadCount can be 0
{unreadCount && <Text>{`You have ${unreadCount} new notifications`}</Text>}
```

If `unreadCount` is `0`, the expression short-circuits and returns `0` — not `false`. React renders numbers. **You'll see a stray `0` appear on screen.**

```jsx
// ✅ Force a boolean with a comparison
{unreadCount > 0 && <Text>...</Text>}

// ✅ Or convert explicitly
{!!unreadCount && <Text>...</Text>}
```

This is one of the most common silent bugs in production RN apps. Always use a comparison (`> 0`, `!== ""`, `!== null`) when the value could legitimately be `0`, `""`, or `NaN`.

---

## `||` for Fallback Values

```js
const displayName = user.nickname || user.name || "Guest";
```

Reads left to right: use `nickname` if it's truthy, else `name` if truthy, else `"Guest"`.

This works fine for strings and objects, but has a sharp edge with numbers and booleans — covered next.

---

## Optional Chaining: `?.`

Before optional chaining, safely reading a nested property meant a chain of manual checks:

```js
// ❌ The old, defensive way
const city = user && user.profile && user.profile.address && user.profile.address.city;
```

Optional chaining replaces this entirely:

```js
// ✅ Stops and returns undefined the moment something is null/undefined
const city = user?.profile?.address?.city;
```

If `user` is `null`, the whole expression short-circuits to `undefined` — no error thrown. If `user.profile` doesn't exist, same thing. It checks at every `?.` step.

### Optional Chaining with Function Calls

```js
// Only calls onRefresh if it exists
onRefresh?.();
```

Extremely common for optional callback props — you don't have to check `if (onRefresh) onRefresh()` first.

### Optional Chaining with Arrays

```js
const firstStep = workoutLog?.[0]?.steps;
```

Safe even if `workoutLog` is `undefined` or an empty array reference doesn't exist yet.

---

## Nullish Coalescing: `??`

`??` provides a fallback — but only for `null` or `undefined`, unlike `||` which triggers on *any* falsy value.

```js
const steps = 0;

console.log(steps || 1000);  // 1000 ❌ — 0 is falsy, so || replaces it
console.log(steps ?? 1000);  // 0    ✅ — 0 is not null/undefined, so ?? keeps it
```

This is the fix for real bugs. If a user has genuinely logged `0` steps today, `||` would silently show `1000` instead. `??` respects that `0` is a valid, meaningful value.

### The Rule of Thumb

```
Could the real value be 0, "", or false — and still be meaningful?
  ├── Yes → use ??
  └── No  → either works, but prefer ?? as the default habit
```

---

## What This Looks Like in React Native

```jsx
const ProfileScreen = ({ user, onRefresh }) => {
  // Optional chaining + nullish coalescing together — extremely common combo
  const city = user?.address?.city ?? "Location not set";
  const steps = user?.stats?.steps ?? 0;
  const avatarUrl = user?.avatar?.url ?? defaultAvatarUrl;

  return (
    <View>
      <Text>{city}</Text>
      <Text>{`Steps today: ${steps}`}</Text>

      {/* Conditional rendering with a proper boolean check */}
      {steps > 0 && <Text>Keep it up!</Text>}

      {/* Optional callback — only fires if provided */}
      <Button title="Refresh" onPress={() => onRefresh?.()} />
    </View>
  );
};
```

Four ES6+ features working together in one small component: optional chaining, nullish coalescing, short-circuit rendering, and an optional function call. This is what real RN screens look like — especially ones consuming API data that may not be fully loaded yet.

---

## Common Mistakes

**Mistake 1: Using `&&` for conditional rendering without a boolean check**

```jsx
// ❌ Renders a stray 0 if cartCount is 0
{cartCount && <Badge count={cartCount} />}

// ✅ Explicit comparison
{cartCount > 0 && <Badge count={cartCount} />}
```

**Mistake 2: Using `||` for numeric fallbacks**

```js
// ❌ Breaks when score is legitimately 0
const displayScore = score || "N/A";

// ✅ Only falls back on null/undefined
const displayScore = score ?? "N/A";
```

**Mistake 3: Chaining `?.` past the point that matters**

```js
// Slightly excessive — if you already null-checked `user` above,
// you don't need ?. on every single property after it
if (user) {
  const name = user?.name; // `?.` here is redundant — user is guaranteed to exist
}
```

Not wrong, just unnecessary. Use `?.` where the value is genuinely uncertain.

---

## Quick Recap

| Operator | Purpose | Triggers On |
|----------|---------|--------------|
| `&&` | Conditional rendering / guard | Any falsy value (`0`, `""`, `false`, `null`, `undefined`) |
| `\|\|` | Fallback value | Any falsy value |
| `??` | Fallback value | Only `null` or `undefined` |
| `?.` | Safe property/method access | Stops at first `null`/`undefined` in the chain |

---

## Up Next

**Chapter 7 — Module 1 Mini Challenge: Refactor a Legacy Component**

Time to put all six chapters together. You'll be given an old, `var`-based, concatenation-heavy React Native component and asked to refactor it using everything from this module — `let`/`const`, arrow functions, template literals, destructuring, spread, and optional chaining.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
