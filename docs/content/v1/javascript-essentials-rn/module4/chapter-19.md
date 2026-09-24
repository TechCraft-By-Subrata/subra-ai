# Chapter 19 — ES Modules: `import`/`export` Patterns in RN Projects

📘 Concept · ⏱ 6 min · Module 4: JS Patterns Native Devs Must Know

---

## 🎯 What You'll Learn

- The difference between **named exports** and **default exports**
- How React Native projects are wired together using `import`/`export`
- Common patterns you'll see in real RN codebases
- Mistakes that cause "undefined is not a function" and how to avoid them

---

## 🧩 Why This Matters in React Native

Every React Native project is a network of JS/TS modules. Components, hooks, utilities, constants, API clients — they all live in separate files and talk to each other through `import` and `export`.

If you get this wrong, you get cryptic errors like:

```
TypeError: undefined is not a function
Element type is invalid — expected a string or a class/function
```

Understanding modules eliminates an entire class of bugs.

---

## 📦 Two Kinds of Exports

### 1. Default Export

A file can have **one** default export. It's what you get when you import without curly braces.

```js
// screens/HomeScreen.js
export default function HomeScreen() {
  return null; // your JSX here
}
```

```js
// App.js
import HomeScreen from './screens/HomeScreen';
// You can name it anything — the name is yours to choose
import MyHome from './screens/HomeScreen'; // also valid
```

> ✅ Default exports are common for **screens, components, and the root App**.

---

### 2. Named Exports

A file can have **many** named exports. You import them by their exact name, inside `{ }`.

```js
// utils/formatters.js
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

export const APP_VERSION = '1.0.0';
```

```js
// Inside a component
import { formatDate, formatCurrency } from './utils/formatters';
import { APP_VERSION } from './utils/formatters';

// Or combine into one import
import { formatDate, formatCurrency, APP_VERSION } from './utils/formatters';
```

> ✅ Named exports are common for **utilities, hooks, constants, and types**.

---

### 3. Mixing Both in One File

You can have a default export and named exports in the same file — this is common in RN.

```js
// hooks/useAuth.js
export const AUTH_STATES = {
  LOADING: 'loading',
  SIGNED_IN: 'signed_in',
  SIGNED_OUT: 'signed_out',
};

export default function useAuth() {
  // hook logic
}
```

```js
import useAuth, { AUTH_STATES } from './hooks/useAuth';
```

---

## 🗂️ Barrel Files — The RN Codebase Pattern

In real RN projects, you'll often see an `index.js` inside a folder that re-exports everything from that folder. This is called a **barrel file**.

```
components/
  Button.js
  Card.js
  Avatar.js
  index.js   ← barrel file
```

```js
// components/index.js
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Avatar } from './Avatar';
```

Now instead of deep imports everywhere:

```js
// ❌ Without barrel
import Button from './components/Button';
import Card from './components/Card';
import Avatar from './components/Avatar';

// ✅ With barrel
import { Button, Card, Avatar } from './components';
```

> ⚡ Barrel files keep import paths short and refactoring-friendly. You'll see this heavily in design system folders.

---

## ⚠️ Common Mistakes

### Mistake 1: Importing a named export as a default

```js
// formatters.js
export function formatDate() { ... }  // named export

// ❌ Wrong — no default export exists
import formatDate from './formatters';

// ✅ Correct
import { formatDate } from './formatters';
```

### Mistake 2: Forgetting `default` when re-exporting

```js
// ❌ This does NOT re-export the default export
export { Button } from './Button';

// ✅ This does
export { default as Button } from './Button';
```

### Mistake 3: Circular imports

Avoid File A importing from File B while File B imports from File A. In RN this can cause components to be `undefined` at runtime. Keep your dependency graph one-directional (utils ← hooks ← components ← screens).

---

## 🔍 Real RN Codebase Patterns

Here's what you'll typically see in a production React Native app:

```js
// Entry point
import App from './App';           // default — root component

// Navigation
import { NavigationContainer } from '@react-navigation/native';  // named

// React Native core
import { View, Text, StyleSheet, FlatList } from 'react-native'; // named

// Local hooks
import useAuth, { AUTH_STATES } from './hooks/useAuth'; // both

// Constants
import { API_BASE_URL, TIMEOUT_MS } from './config/constants'; // named

// Types (TypeScript)
import type { RootStackParamList } from './navigation/types'; // type-only import
```

---

## 🧠 Mental Model

Think of each JS/TS file as a **vending machine**:
- The **default slot** holds one main item (the component or hook that file is "about")
- The **named slots** hold supporting items (helpers, constants, types)
- `import` is how you pick items out of another file's vending machine

---

## ✅ Quick Reference

| Scenario | Syntax |
|---|---|
| Export one main thing | `export default function MyComponent() {}` |
| Export multiple helpers | `export function helper() {}` |
| Import default | `import MyComponent from './MyComponent'` |
| Import named | `import { helper } from './utils'` |
| Import both | `import MyComponent, { helper } from './MyComponent'` |
| Re-export default as named | `export { default as MyComponent } from './MyComponent'` |
| Import everything | `import * as Utils from './utils'` |

---

## 🏋️ Try It Yourself

Create a `config/constants.js` file with three named exports:
- `API_BASE_URL` — a string
- `TIMEOUT_MS` — a number
- `APP_NAME` — a string

Then create a `screens/HomeScreen.js` with a default export component that imports and displays `APP_NAME` from your constants file.

> Check: can you import from `./config/constants` without curly braces? Why not?

---

## ⏭️ Up Next

**Chapter 20** — Truthy/falsy gotchas that break RN conditionals 🧠

You'll learn why `{0 && <View />}` renders a `0` on screen and how to write conditional JSX that actually does what you expect.

---

*Part of [JavaScript Essentials for React Native](https://github.com/TechCraft-By-Subrata/java-script-essentials-for-react-native-developers) · Built by [React Native Mastery](https://rnm.subraatakumar.com)*
