# Chapter 3 — Template Literals for Dynamic Strings & JSX Text

> **Module 1 · Lesson 3 of 7** | 📘 Concept | ⏱ 4 min

---

## What You'll Learn

- Template literal syntax and how it replaces string concatenation
- Embedding expressions, not just variables
- Multi-line strings without escape characters
- Where template literals show up in React Native — styles, API URLs, display text

---

## The Old Way: String Concatenation

Before ES6, building dynamic strings meant joining pieces with `+`:

```js
const name = "Subrata";
const steps = 8432;

const message = "Hello, " + name + "! You've walked " + steps + " steps today.";
```

This works. It's also error-prone — a missing space, a forgotten `+`, a number that doesn't coerce cleanly. The more variables, the worse it gets.

---

## Template Literals

ES6 introduced template literals: strings wrapped in backticks `` ` `` instead of quotes, with `${}` for embedding values:

```js
const name = "Subrata";
const steps = 8432;

const message = `Hello, ${name}! You've walked ${steps} steps today.`;
```

Cleaner, readable left to right, no concatenation operators.

---

## `${}` Takes Any Expression

The `${}` slot isn't limited to variables. It evaluates any valid JavaScript expression:

```js
const price = 49.9;

// Arithmetic
`Total: $${(price * 1.18).toFixed(2)}`   // "Total: $58.88"

// Ternary
const isLoggedIn = true;
`Welcome ${isLoggedIn ? "back" : "guest"}!`  // "Welcome back!"

// Function call
`Today is ${new Date().toDateString()}`   // "Today is Mon Jun 29 2026"
```

Whatever fits in `${}` gets evaluated and coerced to a string.

---

## Multi-line Strings

Template literals preserve line breaks naturally:

```js
// ❌ Old way — escape characters, hard to read
const query = "SELECT *\nFROM users\nWHERE active = true";

// ✅ Template literal — what you write is what you get
const query = `
  SELECT *
  FROM users
  WHERE active = true
`;
```

This matters in React Native when building multi-line log messages, notification bodies, or SQL/GraphQL queries in native modules.

---

## What This Looks Like in React Native

### 1. Dynamic display text in components

```jsx
const StepCounter = ({ name, steps, goal }) => (
  <View>
    <Text>{`Hey ${name}, you're at ${steps} of ${goal} steps!`}</Text>
    <Text>{`${Math.round((steps / goal) * 100)}% complete`}</Text>
  </View>
);
```

> **Why wrap in `{}`?** In JSX, `{}` evaluates a JS expression. A template literal is an expression, so it goes inside `{}`. You'll see this pattern constantly.

### 2. Building API URLs dynamically

```js
const BASE_URL = "https://api.healthapp.com";
const userId = "user_123";
const date = "2026-06-29";

const endpoint = `${BASE_URL}/users/${userId}/steps?date=${date}`;
// "https://api.healthapp.com/users/user_123/steps?date=2026-06-29"
```

Far cleaner than concatenating URL segments with `+`.

### 3. Dynamic StyleSheet values

React Native's `StyleSheet` takes plain objects — not CSS — but template literals still help when values are dynamic:

```js
// Inline styles with dynamic values (use sparingly, but it's valid)
const getBarStyle = (percent) => ({
  width: `${percent}%`,   // Works in some RN layout contexts
  backgroundColor: percent >= 100 ? "#4CAF50" : "#2196F3",
});
```

### 4. Logging and debugging

```js
const logApiCall = (method, url, status) => {
  console.log(`[${method}] ${url} → ${status}`);
  // "[GET] https://api.healthapp.com/steps → 200"
};
```

Structured log lines are dramatically easier to write and read with template literals.

---

## Common Mistakes

**Mistake 1: Using quotes instead of backticks**

```js
// ❌ This is just a string — ${name} is literal text
const msg = "Hello, ${name}";

// ✅ Backticks activate the template
const msg = `Hello, ${name}`;
```

Easy to miss, especially when copy-pasting between files with different quote styles.

**Mistake 2: Overloading `${}` with complex logic**

```jsx
// ❌ Hard to read, hard to debug
<Text>{`${user.profile?.address?.city ?? "Unknown"} — ${
  user.orders.filter(o => o.status === "pending").length
} orders pending`}</Text>

// ✅ Compute first, embed the result
const city = user.profile?.address?.city ?? "Unknown";
const pendingCount = user.orders.filter(o => o.status === "pending").length;

<Text>{`${city} — ${pendingCount} orders pending`}</Text>
```

Template literals are for embedding values, not for running logic. If the expression inside `${}` needs more than a glance to understand, extract it first.

**Mistake 3: Unnecessary template literals**

```js
// ❌ Pointless — no interpolation happening
const label = `Submit`;

// ✅ Plain string is fine
const label = "Submit";
```

Use template literals when you need interpolation or multi-line. A plain string that never changes doesn't need backticks.

---

## Quick Recap

| Feature                  | Concatenation (`+`)      | Template Literal (`` ` ``)     |
|--------------------------|--------------------------|-------------------------------|
| Embed variables          | `"Hi " + name`           | `` `Hi ${name}` ``            |
| Embed expressions        | Awkward                  | `` `${a + b}` `` — clean      |
| Multi-line strings       | Requires `\n`            | Natural line breaks            |
| Readability              | Degrades with complexity | Stays readable                 |
| Used in modern RN code   | Rarely                   | Yes — URLs, labels, logs       |

---

## Up Next

**Chapter 4 — Object & Array Destructuring in Props and State**

You've seen `const { name, steps } = user` in RN components without maybe knowing what it's doing. Destructuring is the single most used ES6 feature in React Native — props, state, hook returns, API responses. Next chapter breaks it all down.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
