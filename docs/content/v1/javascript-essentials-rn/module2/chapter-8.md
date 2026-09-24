# Chapter 8 — Default Parameters & Named Arguments

> **Module 2 · Lesson 1 of 5** | 📘 Concept | ⏱ 5 min

---

## What You'll Learn

- Default parameter syntax and how it replaces manual fallback checks
- Why "named arguments" in JS are really just object destructuring
- How this combination powers configuration-style function calls in RN
- The evaluation order gotchas worth knowing

---

## The Problem: Manual Fallbacks

Before ES6, giving a parameter a fallback value meant checking inside the function body:

```js
function greet(name) {
  name = name || "Athlete";
  console.log(`Hello, ${name}!`);
}
```

This works, but it has the same `0`/`""`/`false` trap you saw in Chapter 6 — `||` replaces any falsy value, not just missing ones. And it adds a line of defensive code to every function that needs a fallback.

---

## Default Parameters

ES6 lets you declare the fallback directly in the parameter list:

```js
function greet(name = "Athlete") {
  console.log(`Hello, ${name}!`);
}

greet();            // "Hello, Athlete!"
greet("Subrata");   // "Hello, Subrata!"
greet(undefined);   // "Hello, Athlete!" — undefined triggers the default
greet(null);        // "Hello, null!" — null does NOT trigger the default
```

**Important distinction:** default parameters only kick in for `undefined`, not for `null`, `0`, `""`, or `false`. This is actually safer than `||` — it doesn't accidentally override legitimate falsy values like `0` or `""`.

```js
function setVolume(level = 50) {
  console.log(level);
}

setVolume(0); // 0 — correct! Not overridden, unlike the `||` pattern
```

---

## Defaults Can Reference Earlier Parameters

```js
function createUser(name, displayName = name) {
  return { name, displayName };
}

createUser("Subrata");                  // { name: "Subrata", displayName: "Subrata" }
createUser("Subrata", "Subrata Kumar"); // { name: "Subrata", displayName: "Subrata Kumar" }
```

Parameters are evaluated left to right, so a later default can use an earlier parameter's value.

---

## "Named Arguments" — JS Doesn't Have Them, But Destructuring Fakes It Well

Some languages (Python, Kotlin) let you call a function with explicit parameter names:

```python
# Python — real named arguments
create_user(name="Subrata", role="admin")
```

JavaScript has no native equivalent. Calling `createUser("Subrata", "admin")` means you must remember the exact parameter order. Get it wrong, and you pass the wrong value to the wrong slot — silently.

The fix: accept a single object parameter and destructure it.

```js
// Instead of positional parameters...
function createUser(name, role, isActive) { /* ... */ }
createUser("Subrata", "admin", true); // which is which? Hard to tell at the call site

// ...accept one object, destructure with defaults
function createUser({ name, role = "member", isActive = true }) {
  return { name, role, isActive };
}

createUser({ name: "Subrata", role: "admin" });
// Order doesn't matter, and intent is obvious at the call site
```

This pattern combines two things you already know: destructuring (Chapter 4) and default parameters (this chapter).

---

## What This Looks Like in React Native

### 1. Reusable components with configuration objects

```jsx
const Avatar = ({ uri, size = 48, borderRadius = size / 2, borderColor = "#ddd" }) => (
  <Image
    source={{ uri }}
    style={{ width: size, height: size, borderRadius, borderColor }}
  />
);

// Call site reads clearly — no guessing what each value means
<Avatar uri={user.avatarUrl} size={64} />
```

This is exactly how every functional RN component you've written since Chapter 4 already works — props *are* named arguments via object destructuring.

### 2. API helper functions

```js
const fetchSteps = async ({ userId, startDate, endDate = new Date().toISOString() }) => {
  const response = await fetch(
    `${BASE_URL}/users/${userId}/steps?from=${startDate}&to=${endDate}`
  );
  return response.json();
};

fetchSteps({ userId: "u_123", startDate: "2026-06-01" });
// endDate defaults to today — caller doesn't need to think about it
```

### 3. Custom hook configuration

```js
const useDebounce = (value, { delay = 300, immediate = false } = {}) => {
  // implementation
};

useDebounce(searchTerm, { delay: 500 });
useDebounce(searchTerm); // uses both defaults — delay: 300, immediate: false
```

Notice the `= {}` at the very end of the parameter — this matters, and it's the next section.

---

## The `= {}` Safety Net

If a function destructures its only parameter and that parameter is never passed at all, you get a crash:

```js
const useDebounce = (value, { delay = 300 } = {}) => { /* ... */ };

useDebounce(searchTerm); // ✅ works — second arg defaults to {}, then delay defaults to 300
```

Without the trailing `= {}`:

```js
const useDebounce = (value, { delay = 300 }) => { /* ... */ };

useDebounce(searchTerm); // ❌ TypeError: Cannot destructure property 'delay' of 'undefined'
```

If the second argument is never passed, it's `undefined` — and you can't destructure `undefined`. The `= {}` default gives destructuring something to work with even when nothing was passed in. This is the same pattern you used in Chapter 4 (`exercises = []`), just one level up at the whole-parameter level.

---

## Evaluation Order Gotcha

Default values are evaluated **at call time**, not when the function is defined:

```js
let counter = 0;

function logCall(id = counter++) {
  console.log(id);
}

logCall(); // 0
logCall(); // 1
logCall(); // 2
```

Each call re-evaluates the default expression. This is rarely useful directly, but it explains why `new Date()` as a default (like the `fetchSteps` example above) gives you the date at call time, not the date the module was loaded.

---

## Common Mistakes

**Mistake 1: Using `||` instead of a default parameter**

```js
// ❌ Breaks if volume is legitimately 0
function setVolume(level) {
  level = level || 50;
}

// ✅ Default parameter respects 0 as a real value
function setVolume(level = 50) {}
```

**Mistake 2: Forgetting the trailing `= {}` on optional config objects**

```js
// ❌ Crashes if called with zero arguments
const useFetch = ({ retries = 3 }) => {};
useFetch(); // TypeError

// ✅ Safe even with no arguments
const useFetch = ({ retries = 3 } = {}) => {};
useFetch(); // retries: 3
```

**Mistake 3: Over-relying on positional parameters for functions with 3+ args**

```js
// ❌ Call site is unreadable
createNotification("Workout complete", "success", true, 5000);

// ✅ Object parameter — self-documenting
createNotification({
  message: "Workout complete",
  type: "success",
  dismissible: true,
  duration: 5000,
});
```

Rule of thumb: 1–2 parameters, positional is fine. 3 or more, switch to a destructured object.

---

## Quick Recap

| Pattern | Syntax | Triggers Default On |
|---------|--------|----------------------|
| Default parameter | `(name = "Athlete") =>` | Only `undefined` |
| Destructured defaults | `({ role = "member" }) =>` | Only `undefined` (per key) |
| Safe optional object param | `({ delay = 300 } = {}) =>` | Whole param missing, or any key missing |
| "Named arguments" in JS | Object param + destructuring | N/A — this is a calling convention, not a JS feature |

---

## Up Next

**Chapter 9 — Closures Explained with a Real `useCallback` Example**

You've used default parameters and destructuring for two modules now. Chapter 9 goes one level deeper — closures, the mechanism behind nearly every React hook you'll write, and the source of one of the most common (and confusing) bugs in functional components: stale state.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
