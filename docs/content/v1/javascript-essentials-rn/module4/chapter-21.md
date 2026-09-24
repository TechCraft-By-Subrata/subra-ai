# Chapter 21 — Nullish Coalescing (`??`) vs OR (`||`) — Safe Defaults

📘 Concept · 🏋️ Exercise · ⏱ 6 min · Module 4: JS Patterns Native Devs Must Know

---

## 🎯 What You'll Learn

- How `||` works for default values — and where it silently fails
- What `??` (nullish coalescing) does differently
- When to use each operator in React Native code
- How `??=` and `?.` combine with `??` in real RN patterns

---

## 🧩 Why This Matters in React Native

In the last chapter you learned that `0`, `""`, and `NaN` are falsy. Now here's the follow-up problem: the most natural way to write default values in JavaScript — using `||` — uses that same falsy check. So it accidentally swallows valid data.

You set a default for a missing value, but `||` fires even when the value is present. Your user's score of `0` becomes `"—"`. Their empty username override gets ignored. A free item priced at `$0.00` shows `$9.99` instead.

`??` was introduced precisely to fix this — and it's now one of the most important operators in a React Native developer's toolkit.

---

## 🔀 How `||` Works

`||` returns the **first truthy value** it finds, or the last value if none are truthy.

```js
const result = a || b;
// Returns a if a is truthy, otherwise returns b
```

This works great for booleans — but it treats **all falsy values** the same, including ones that might be perfectly valid data:

```js
const score = 0 || "No score yet";    // "No score yet" — but 0 IS a valid score! 💥
const label = "" || "Unnamed";        // "Unnamed" — but "" might be intentional 💥
const count = null || 10;             // 10 ✅ — null really is missing data
const name = undefined || "Guest";    // "Guest" ✅ — undefined really is missing
```

The problem: `||` cannot distinguish between *"this value is missing"* and *"this value is zero / empty"*.

---

## 🔀 How `??` Works

`??` returns the **right side only when the left side is `null` or `undefined`** — nothing else triggers it.

```js
const result = a ?? b;
// Returns a unless a is null or undefined, in which case returns b
```

```js
const score = 0 ?? "No score yet";    // 0 ✅ — 0 is not null/undefined
const label = "" ?? "Unnamed";        // "" ✅ — empty string is not null/undefined
const count = null ?? 10;             // 10 ✅ — null triggers ??
const name = undefined ?? "Guest";    // "Guest" ✅ — undefined triggers ??
```

`??` only asks one question: **"Is this value null or undefined?"** If yes, use the fallback. If no — even if the value is `0`, `false`, or `""` — keep it.

---

## ⚖️ Side-by-Side Comparison

| Expression | `\|\|` result | `??` result |
|---|---|---|
| `0 \|\| 10` | `10` ❌ | — |
| `0 ?? 10` | — | `0` ✅ |
| `"" \|\| "default"` | `"default"` ❌ | — |
| `"" ?? "default"` | — | `""` ✅ |
| `false \|\| true` | `true` | — |
| `false ?? true` | — | `false` ✅ |
| `null \|\| "fallback"` | `"fallback"` ✅ | — |
| `null ?? "fallback"` | — | `"fallback"` ✅ |
| `undefined \|\| "fallback"` | `"fallback"` ✅ | — |
| `undefined ?? "fallback"` | — | `"fallback"` ✅ |

**Rule of thumb:** If you only want to fall back when the value is truly *absent* (`null` / `undefined`), use `??`. If you want to fall back on any falsy value, use `||`.

---

## 💥 The Classic RN Bug

```jsx
function ScoreBoard({ score, playerName }) {
  // ❌ score of 0 shows "—" instead of "0"
  const displayScore = score || "—";

  // ❌ An empty string name shows "Anonymous" even if intentionally blank
  const displayName = playerName || "Anonymous";

  return (
    <View>
      <Text>{displayName}</Text>
      <Text>{displayScore}</Text>
    </View>
  );
}
```

```jsx
function ScoreBoard({ score, playerName }) {
  // ✅ Only falls back when score is null or undefined
  const displayScore = score ?? "—";

  // ✅ Only falls back when playerName is null or undefined
  const displayName = playerName ?? "Anonymous";

  return (
    <View>
      <Text>{displayName}</Text>
      <Text>{displayScore}</Text>
    </View>
  );
}
```

---

## 🗺️ Real RN Codebase Patterns

### API response defaults

```js
// User profile from API — fields may be null if not set
const displayName = user.displayName ?? "Anonymous";
const bio = user.bio ?? "No bio yet";
const followerCount = user.followerCount ?? 0;
const rating = user.rating ?? null; // keep null if truly unrated
```

### Navigation params

```js
// React Navigation — params may be undefined if not passed
function ProductScreen({ route }) {
  const { productId, referralCode } = route.params ?? {};
  const quantity = route.params?.quantity ?? 1;
}
```

### Config with partial overrides

```js
const DEFAULT_CONFIG = {
  timeout: 5000,
  retries: 3,
  debug: false,
};

function buildConfig(userConfig) {
  return {
    timeout: userConfig.timeout ?? DEFAULT_CONFIG.timeout,
    retries: userConfig.retries ?? DEFAULT_CONFIG.retries,
    // ✅ If user passes retries: 0, we keep 0 (not fallback to 3)
    debug: userConfig.debug ?? DEFAULT_CONFIG.debug,
    // ✅ If user passes debug: false, we keep false
  };
}
```

### AsyncStorage values

```js
// AsyncStorage returns null for missing keys, not undefined
const storedTheme = await AsyncStorage.getItem('theme');
const theme = storedTheme ?? 'light'; // 'light' only if key was never set
```

---

## 🔗 Combining `??` with `?.`

`??` pairs naturally with optional chaining (`?.`) from chapter 6 — you've likely already seen this in real code:

```js
// Read a deeply nested value, fall back if any part of the chain is missing
const city = user?.address?.city ?? "Unknown city";
const avatar = profile?.media?.avatar?.url ?? DEFAULT_AVATAR;
const plan = subscription?.tier?.name ?? "Free";
```

This pattern — `?.` to safely traverse, `??` to provide a fallback — is arguably the most common two-operator combination in modern RN codebases.

---

## 🔗 The `??=` Assignment Operator (Bonus)

ES2021 added `??=` — assign a value only if the variable is currently `null` or `undefined`:

```js
let config = null;
config ??= { theme: 'light', fontSize: 14 };
// config is now { theme: 'light', fontSize: 14 }

let userId = 0;
userId ??= 999;
// userId is still 0 — 0 is not null/undefined
```

You'll see this used for lazy initialisation in hooks and utility functions.

---

## 🧠 Mental Model

`||` is a **truthiness gate**: *"Give me the first thing that's not empty, zero, or false."*

`??` is a **presence gate**: *"Give me the first thing that actually exists (isn't null or undefined)."*

When writing defaults for data that comes from an API, props, or storage — where `0`, `false`, and `""` are all valid real values — `??` is almost always the right choice.

When writing fallbacks for feature flags, boolean toggles, or situations where falsy values genuinely mean "off" — `||` still has its place.

---

## ✅ Quick Reference

| Use case | Operator | Why |
|---|---|---|
| Default for missing API field | `??` | `0` and `""` are valid values |
| Default for a boolean feature flag | `\|\|` | `false` means "off", fallback is fine |
| Default for a count or score | `??` | `0` is a meaningful value |
| Default for a display name | `??` | `""` might be a valid override |
| Guarding a whole chain | `?. ` + `??` | Traverse safely, then fall back |
| Lazy initialise a variable | `??=` | Only set if truly absent |

---

## 🧠 Quiz

**Q1.** What does each line evaluate to?

```js
const a = 0 || 100;
const b = 0 ?? 100;
const c = null || 100;
const d = null ?? 100;
const e = false ?? "yes";
```

<details>
<summary>See answer</summary>

```js
const a = 0 || 100;     // 100 — 0 is falsy, || falls through
const b = 0 ?? 100;     // 0  — 0 is not null/undefined, ?? keeps it
const c = null || 100;  // 100 — null is falsy, || falls through
const d = null ?? 100;  // 100 — null triggers ??
const e = false ?? "yes"; // false — false is not null/undefined, ?? keeps it
```

</details>

---

**Q2.** A user's step count for today is `0`. Which gives the correct display?

```js
// A
const steps = user.steps || "No data";

// B
const steps = user.steps ?? "No data";
```

<details>
<summary>See answer</summary>

**B** is correct. `0 ?? "No data"` returns `0` — a valid step count. Option A using `||` would return `"No data"` even when the user legitimately walked 0 steps, which is misleading.

</details>

---

**Q3.** Fix the bug in this settings loader:

```js
function loadSettings(saved) {
  return {
    darkMode: saved.darkMode || false,
    fontSize: saved.fontSize || 16,
    notifications: saved.notifications || true,
  };
}
```

Called with `loadSettings({ darkMode: false, fontSize: 0, notifications: false })` — what's wrong, and how do you fix it?

<details>
<summary>See answer</summary>

All three have the same bug — `||` treats the user's saved `false` and `0` as "missing" and replaces them with the defaults:

- `false || false` → `false` (accidentally works here, but wrong reason)
- `0 || 16` → `16` ❌ (user wanted font size 0, or maybe this is a valid minimum)
- `false || true` → `true` ❌ (user explicitly turned notifications off, but they turn back on)

Fix with `??`:

```js
function loadSettings(saved) {
  return {
    darkMode: saved.darkMode ?? false,
    fontSize: saved.fontSize ?? 16,
    notifications: saved.notifications ?? true,
  };
}
```

Now user preferences of `false` and `0` are respected — only `null` or `undefined` (truly missing settings) fall back to defaults.

</details>

---

## 🏋️ Try It Yourself

You're building a user profile screen. The `user` object comes from an API and any field can be `null` if the user hasn't filled it in yet:

```js
const user = {
  displayName: null,
  age: 0,           // user is 0? unlikely, but age could be a valid number
  bio: "",          // user intentionally left bio blank
  followersCount: 0,
  isPremium: false,
};
```

Write a `normaliseUser(user)` function that:

1. Falls back `displayName` to `"Anonymous"` only if null/undefined
2. Falls back `age` to `null` (keep it null — don't invent a number)
3. Falls back `bio` to `"No bio yet"` — but **only** if bio is null/undefined, not if the user intentionally cleared it
4. Falls back `followersCount` to `0` only if missing
5. Falls back `isPremium` to `false` only if missing

Then answer: which of these would have broken with `||`?

---

## ⏭️ Up Next

**Chapter 22** — Writing a custom hook from scratch using all concepts above 🎬🏋️

Everything from chapters 19–21 comes together. You'll build a `useUserProfile` hook that fetches data, handles loading and error states, applies safe defaults with `??`, and wires up optional chaining — end to end.

---

*Part of [JavaScript Essentials for React Native](https://github.com/TechCraft-By-Subrata/java-script-essentials-for-react-native-developers) · Built by [React Native Mastery](https://rnm.subraatakumar.com)*
