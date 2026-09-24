# Chapter 5 — Spread & Rest Operators: Copying State the Right Way

> **Module 1 · Lesson 5 of 7** | 📘 Concept · 🏋️ Exercise | ⏱ 7 min

---

## What You'll Learn

- What `...` means as spread vs rest — same symbol, different jobs
- How to copy and update objects and arrays without mutating them
- Why React and React Native require immutable state updates
- The spread patterns you'll write every single day in RN

---

## Same Symbol, Two Jobs

The `...` operator does two opposite things depending on where it appears:

| Position | Name | What it does |
|----------|------|--------------|
| In a function **parameter** | Rest | Collects multiple values **into** an array |
| Everywhere else | Spread | Expands an iterable **out** into individual values |

Let's look at each.

---

## Spread — Expanding Values Out

### Spreading an object

```js
const defaults = { theme: "dark", fontSize: 16, notifications: true };
const userPrefs = { fontSize: 20, language: "en" };

const finalConfig = { ...defaults, ...userPrefs };
// { theme: "dark", fontSize: 20, notifications: true, language: "en" }
```

Keys from `userPrefs` overwrite matching keys from `defaults`. Order matters — last one wins.

### Spreading an array

```js
const morning = ["stretch", "hydrate"];
const evening = ["walk", "meditate"];

const routine = [...morning, "lunch", ...evening];
// ["stretch", "hydrate", "lunch", "walk", "meditate"]
```

---

## Rest — Collecting Values In

### Rest in function parameters

```js
const sum = (...numbers) => numbers.reduce((acc, n) => acc + n, 0);

sum(1, 2, 3, 4); // 10
```

`...numbers` collects all arguments into an array. Useful for utility functions that accept variable arguments.

### Rest in destructuring

```js
const { name, age, ...rest } = { name: "Subrata", age: 30, city: "Bengaluru", role: "Lead" };

console.log(name); // "Subrata"
console.log(rest); // { city: "Bengaluru", role: "Lead" }
```

`...rest` captures everything that wasn't explicitly destructured. You'll see this when you want to pass remaining props down to a child component.

---

## Why React Native Requires Immutable Updates

React tracks state changes by **reference comparison**. When you call `setState`, React checks: is this a new object/array, or the same one?

```js
// ❌ Mutating state directly — React won't detect the change
const [user, setUser] = useState({ name: "Subrata", steps: 0 });

user.steps = 500;   // You changed the object, but the reference is the same
setUser(user);      // React sees the same reference → no re-render
```

```js
// ✅ Creating a new object — React sees a new reference → re-renders
setUser({ ...user, steps: 500 });
```

`{ ...user, steps: 500 }` creates a brand new object with all of `user`'s properties, then overwrites `steps`. The original `user` object is untouched. React sees a new reference and re-renders.

This is the single most important use of spread in React Native.

---

## What This Looks Like in React Native

### 1. Updating a single field in state

```js
const [profile, setProfile] = useState({
  name: "Subrata",
  city: "Bengaluru",
  steps: 0,
});

// Update only steps — keep everything else
setProfile(prev => ({ ...prev, steps: prev.steps + 500 }));
```

`prev =>` is the functional update form — always use this when the new value depends on the old one. The spread copies all existing fields; `steps` at the end overwrites only that key.

### 2. Adding an item to an array in state

```js
const [logs, setLogs] = useState([]);

const addLog = (entry) => {
  setLogs(prev => [...prev, entry]);
};
```

`[...prev, entry]` creates a new array with all existing entries plus the new one. Never `prev.push(entry)` — that mutates.

### 3. Removing an item from an array in state

```js
const removeLog = (id) => {
  setLogs(prev => prev.filter(log => log.id !== id));
};
```

`filter` already returns a new array, so no spread needed here. Worth knowing — not every update needs `...`.

### 4. Forwarding props with additions or overrides

```js
const PrimaryButton = ({ style, ...rest }) => (
  <TouchableOpacity
    style={[styles.base, style]}
    {...rest}  // forwards onPress, disabled, testID, etc.
  />
);
```

`...rest` captures every prop except `style`, then `{...rest}` spreads them onto the native component. This is the standard pattern for wrapper components in RN design systems.

### 5. Merging StyleSheet-like objects

```js
const baseStyle = { padding: 12, borderRadius: 8, backgroundColor: "#fff" };

const cardStyle = { ...baseStyle, backgroundColor: "#f5f5f5", elevation: 2 };
// Inherits padding + borderRadius, overrides backgroundColor, adds elevation
```

---

## The Shallow Copy Caveat

Spread only copies one level deep:

```js
const state = {
  user: { name: "Subrata", address: { city: "Bengaluru" } },
  steps: 0,
};

const next = { ...state, steps: 500 };

// `next.user` is the SAME reference as `state.user`
next.user.address.city = "Mumbai"; // ❌ Mutates the original!
```

For nested updates, you need to spread at every level you're changing:

```js
const next = {
  ...state,
  user: {
    ...state.user,
    address: {
      ...state.user.address,
      city: "Mumbai",   // ✅ Only this changes; nothing above is mutated
    },
  },
};
```

Verbose, but correct. In practice, if your state has deep nesting, consider flattening it or using `useReducer` instead of `useState`.

---

## 🏋️ Exercise

Given this state and the three update requirements below, write the correct `setState` calls without mutating the original:

```js
const [workout, setWorkout] = useState({
  userId: "u_001",
  date: "2026-06-29",
  exercises: ["pushups", "squats"],
  stats: {
    calories: 0,
    duration: 0,
  },
});
```

**Task 1:** Add `"lunges"` to the `exercises` array.

**Task 2:** Update `calories` to `320` inside `stats` without touching `duration`.

**Task 3:** Change `date` to `"2026-06-30"` and add `"burpees"` to `exercises` in a single `setWorkout` call.

<details>
<summary>Solution</summary>

```js
// Task 1
setWorkout(prev => ({
  ...prev,
  exercises: [...prev.exercises, "lunges"],
}));

// Task 2
setWorkout(prev => ({
  ...prev,
  stats: { ...prev.stats, calories: 320 },
}));

// Task 3
setWorkout(prev => ({
  ...prev,
  date: "2026-06-30",
  exercises: [...prev.exercises, "burpees"],
}));
```

</details>

---

## Common Mistakes

**Mistake 1: Mutating state directly**

```js
// ❌ Mutates — React won't re-render
setLogs(prev => {
  prev.push(newEntry);
  return prev; // same reference
});

// ✅ New array — React re-renders
setLogs(prev => [...prev, newEntry]);
```

**Mistake 2: Forgetting spread order**

```js
const base = { color: "blue", size: 16 };

// ❌ base overrides the override — size stays 16
const result = { size: 24, ...base };

// ✅ override wins — size becomes 24
const result = { ...base, size: 24 };
```

Last key wins. Put the overrides after the spread.

**Mistake 3: Assuming spread deep-copies**

```js
const a = { nested: { value: 1 } };
const b = { ...a };

b.nested.value = 99;
console.log(a.nested.value); // 99 — a was mutated!
```

Spread is shallow. Spread at every nested level you're changing.

---

## Quick Recap

| Pattern | Syntax | Use Case |
|---------|--------|----------|
| Spread object | `{ ...obj }` | Copy / merge objects |
| Spread array | `[...arr]` | Copy / append arrays |
| Override field | `{ ...obj, key: newVal }` | Immutable state update |
| Nested update | `{ ...obj, inner: { ...obj.inner, key: val } }` | Deep state update |
| Rest in params | `(...args) =>` | Variadic functions |
| Rest in destructure | `const { a, ...rest } = obj` | Forwarding remaining props |

---

## Up Next

**Chapter 6 — Short-Circuit Evaluation & Optional Chaining (`?.`) in RN**

`user?.profile?.avatar ?? defaultAvatar` — you've seen lines like this in RN code and maybe moved on. Chapter 6 breaks down exactly what each operator does, why they exist, and how they prevent the most common runtime crashes in React Native apps.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
