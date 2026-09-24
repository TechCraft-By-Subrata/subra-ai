# Chapter 1 — `let`, `const` & Block Scoping: Why `var` Is Gone

> **Module 1 · Lesson 1 of 7** | 📘 Concept | ⏱ 5 min

---

## What You'll Learn

- The difference between `var`, `let`, and `const`
- What block scoping means and why it matters
- Why React Native codebases don't use `var` — ever
- The rule of thumb for picking between `let` and `const`

---

## The Problem with `var`

Before ES6 (2015), JavaScript only had `var`. It worked, but it had two behaviours that caused real bugs:

### 1. `var` is function-scoped, not block-scoped

```js
function checkAge() {
  if (true) {
    var message = "Hello";
  }
  console.log(message); // "Hello" — leaks out of the if block!
}
```

The `if` block didn't contain `message`. It leaked into the entire function. In a large component with multiple conditionals, this produces bugs that are genuinely hard to trace.

### 2. `var` is hoisted and initialised as `undefined`

```js
console.log(name); // undefined — no error!
var name = "Subrata";
```

JavaScript quietly moved the declaration to the top and set it to `undefined`. You got no error, just silent garbage.

These aren't edge cases. They're how `var` works by design. Which is why modern JS dropped it.

---

## Enter `let` and `const`

ES6 introduced two replacements. Both are **block-scoped** — they only exist inside the `{ }` they're declared in.

### `let` — for values that will change

```js
let count = 0;
count = count + 1; // ✅ reassignment is fine
```

### `const` — for values that won't be reassigned

```js
const APP_NAME = "WaterTracker"; // ✅
APP_NAME = "Something else";     // ❌ TypeError
```

> **Important:** `const` prevents reassignment, not mutation. You can still push to a `const` array or update properties of a `const` object. More on that in Module 3.

---

## Block Scoping in Action

```js
function renderGreeting(isLoggedIn) {
  if (isLoggedIn) {
    const message = "Welcome back!";
    console.log(message); // ✅ works here
  }
  console.log(message); // ❌ ReferenceError — doesn't exist here
}
```

`message` dies at the closing `}` of the `if` block. That's the intended behaviour. Contained, predictable, easy to debug.

---

## What This Looks Like in React Native

Open any React Native component and you'll see this immediately:

```jsx
// ✅ Standard RN component — every variable is let or const
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';

const HomeScreen = () => {
  const title = "Today's Steps";          // never reassigned → const
  const [count, setCount] = useState(0);  // state variable → const (useState handles mutation)

  const handlePress = () => {
    let updatedCount = count + 1;         // temporary value inside a function → let
    setCount(updatedCount);
  };

  return (
    <View>
      <Text>{title}</Text>
      <Text>{count}</Text>
      <Button title="Add Step" onPress={handlePress} />
    </View>
  );
};

export default HomeScreen;
```

Notice:
- `const HomeScreen` — the component itself never gets reassigned
- `const title` — a string that never changes
- `const [count, setCount]` — `useState` returns a constant reference; React manages the value internally
- `let updatedCount` — a local, short-lived variable inside `handlePress`

You will never see `var` in a well-maintained React Native codebase. ESLint's `no-var` rule is on by default in most RN templates.

---

## The Decision Rule

When you're writing RN code, use this:

```
Is this value ever going to be reassigned?
  ├── No  → const  (default choice)
  └── Yes → let
```

Start with `const`. Downgrade to `let` only when you actually need to reassign. Never use `var`.

---

## Common Mistakes

**Mistake 1: Using `let` for everything "just to be safe"**

```js
// ❌ Misleads the reader — suggests this might change
let API_URL = "https://api.example.com";

// ✅ Correct — signals this never changes
const API_URL = "https://api.example.com";
```

**Mistake 2: Thinking `const` means immutable**

```js
const user = { name: "Subrata" };
user.name = "Kumar"; // ✅ This works — const only blocks reassignment
user = {};           // ❌ This throws — you can't reassign the binding
```

---

## Quick Recap

| Feature          | `var`          | `let`         | `const`       |
|------------------|----------------|---------------|---------------|
| Scope            | Function       | Block         | Block         |
| Hoisting         | Yes (undefined)| Yes (TDZ*)    | Yes (TDZ*)    |
| Reassignable     | ✅             | ✅            | ❌            |
| Used in RN code  | Never          | Sometimes     | Almost always |

> *TDZ = Temporal Dead Zone. Accessing a `let` or `const` before declaration throws a `ReferenceError` instead of silently returning `undefined`. This is the correct behaviour.

---

## Up Next

**Chapter 2 — Arrow Functions & Implicit Returns**

Arrow functions are everywhere in React Native — event handlers, `.map()` callbacks, hook definitions. In the next chapter you'll learn exactly what makes them different from regular functions and when that difference matters.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
