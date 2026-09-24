# Chapter 4 — Object & Array Destructuring in Props and State

> **Module 1 · Lesson 4 of 7** | 📘 Concept · 🎬 Demo | ⏱ 8 min

---

## What You'll Learn

- Object destructuring syntax and how it maps to props
- Array destructuring and why `useState` uses it
- Renaming, default values, and nested destructuring
- Where destructuring shows up in React Native — and how to read it instantly

---

## The Problem It Solves

Without destructuring, accessing object properties gets repetitive fast:

```js
const user = { name: "Subrata", age: 30, city: "Bengaluru" };

console.log(user.name);
console.log(user.age);
console.log(user.city);
```

And in a component receiving props, it gets worse:

```jsx
const ProfileCard = (props) => (
  <View>
    <Text>{props.name}</Text>
    <Text>{props.age}</Text>
    <Text>{props.city}</Text>
  </View>
);
```

`props.` everywhere. Destructuring eliminates it.

---

## Object Destructuring

Pull values out of an object into named variables in one line:

```js
const user = { name: "Subrata", age: 30, city: "Bengaluru" };

const { name, age, city } = user;

console.log(name); // "Subrata"
console.log(age);  // 30
```

The variable names must match the object's keys. Order doesn't matter.

---

## Destructuring Props Directly in the Function Signature

This is the pattern you'll see in virtually every React Native component:

```jsx
// ❌ Using props object — verbose
const ProfileCard = (props) => (
  <View>
    <Text>{props.name}</Text>
    <Text>{props.city}</Text>
  </View>
);

// ✅ Destructuring in the parameter — clean
const ProfileCard = ({ name, city }) => (
  <View>
    <Text>{name}</Text>
    <Text>{city}</Text>
  </View>
);
```

The `{ name, city }` in the parameter position is destructuring happening at the point of receiving the argument. Same thing, one step earlier.

---

## Default Values

If a prop might be undefined, set a fallback right in the destructure:

```jsx
const StepBadge = ({ steps = 0, label = "Steps" }) => (
  <View>
    <Text>{label}: {steps}</Text>
  </View>
);

// Works fine even if called with no props
<StepBadge />  // renders "Steps: 0"
```

No need for `steps || 0` inside the component body. The default lives at the entry point.

---

## Renaming While Destructuring

Sometimes the key name in an object conflicts with an existing variable, or you just want a more descriptive local name:

```js
const response = { data: { userId: "u_123", score: 94 } };

// Rename `data` to `userData` as you destructure
const { data: userData } = response;

console.log(userData); // { userId: "u_123", score: 94 }
console.log(data);     // ❌ ReferenceError — `data` wasn't declared
```

Syntax: `{ originalKey: newName }`. The original key name is not created as a variable — only the new name is.

---

## Nested Destructuring

You can go one level deeper in the same statement:

```js
const response = { data: { userId: "u_123", score: 94 } };

const { data: { userId, score } } = response;

console.log(userId); // "u_123"
console.log(score);  // 94
```

Useful for API responses, but keep it to one level of nesting in practice. Two levels deep becomes harder to read than just writing `response.data.userId`.

---

## Array Destructuring

Objects destructure by key name. Arrays destructure by **position**:

```js
const colors = ["red", "green", "blue"];

const [first, second] = colors;

console.log(first);  // "red"
console.log(second); // "green"
```

You name the variables yourself — the names don't need to match anything. Position is what matters.

### Skipping Elements

```js
const [, , third] = colors;
console.log(third); // "blue"
```

Empty commas skip positions.

---

## `useState` Is Just Array Destructuring

This is the most important application of array destructuring in React Native:

```js
const [count, setCount] = useState(0);
```

`useState(0)` returns an array: `[currentValue, setterFunction]`. Array destructuring pulls them out and lets you name them whatever makes sense:

```js
// These are all equivalent — just different names
const [count, setCount] = useState(0);
const [steps, setSteps] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [user, setUser] = useState(null);
```

Every time you write `useState`, you're using array destructuring. Now you know why the syntax looks the way it does.

---

## Real Component Putting It All Together

```jsx
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';

// Object destructuring in props — with a default value
const StepTracker = ({ goal = 10000, userName = "Friend" }) => {

  // Array destructuring from useState
  const [steps, setSteps] = useState(0);

  // Object destructuring from an API response shape
  const { percentage, remaining } = {
    percentage: Math.round((steps / goal) * 100),
    remaining: Math.max(goal - steps, 0),
  };

  return (
    <View>
      <Text>{`Hey ${userName}!`}</Text>
      <Text>{`Steps: ${steps} / ${goal}`}</Text>
      <Text>{`${percentage}% done — ${remaining} to go`}</Text>
      <Button title="+ 500 Steps" onPress={() => setSteps(s => s + 500)} />
    </View>
  );
};

export default StepTracker;
```

Three different destructuring patterns in one small component. Once you recognise them, you can read any RN codebase fluently.

---

## Common Mistakes

**Mistake 1: Destructuring a value that might be `null` or `undefined`**

```js
const user = null;

const { name } = user; // ❌ TypeError: Cannot destructure property 'name' of null
```

Guard before you destructure:

```js
const { name } = user ?? {};       // ✅ fallback to empty object
const { name } = user || {};       // ✅ also works (prefer ?? for null/undefined)
```

You'll encounter this constantly with API data that hasn't loaded yet.

**Mistake 2: Confusing rename syntax with nesting**

```js
const { data: userData } = response;
// `userData` exists ✅
// `data` does NOT exist ✅

// Easy to forget and try to use `data` later
console.log(data); // ❌ ReferenceError
```

**Mistake 3: Over-destructuring in function signatures**

```jsx
// ❌ Too deep — hard to see what the component actually needs at a glance
const Card = ({ user: { profile: { name, avatar }, settings: { theme } } }) => ...

// ✅ Destructure one level in the signature, go deeper inside
const Card = ({ user }) => {
  const { profile, settings } = user;
  const { name, avatar } = profile;
  ...
};
```

---

## Quick Recap

| Pattern                         | Syntax                                  | Where You'll See It in RN           |
|---------------------------------|-----------------------------------------|-------------------------------------|
| Object destructuring            | `const { a, b } = obj`                 | API responses, config objects       |
| Props destructuring             | `({ name, age }) =>`                   | Every functional component          |
| Default values                  | `({ steps = 0 }) =>`                   | Optional props with fallbacks       |
| Renaming                        | `const { data: userData } = res`       | Avoiding name collisions            |
| Nested destructuring            | `const { data: { id } } = res`         | One-off API response unpacking      |
| Array destructuring             | `const [a, b] = arr`                   | `useState`, `useReducer`, `useMemo` |

---

## Up Next

**Chapter 5 — Spread & Rest Operators: Copying State the Right Way**

You've seen `...` in RN codebases — `{ ...prevState, count: 5 }`, `...props`, `...args`. The spread and rest operators are behind all of it. Next chapter covers exactly when and why to use them, including the immutable state update pattern React depends on.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
