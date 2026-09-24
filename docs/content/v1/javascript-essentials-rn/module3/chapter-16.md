# Chapter 16 — Immutable State Updates: Why You Can't Mutate in React

> **Module 3 · Lesson 4 of 6** | 📘 Concept · 🎬 Demo | ⏱ 9 min

---

## What You'll Learn

- Why React's rendering model requires immutability
- What actually breaks when you mutate state directly
- The complete pattern toolkit for every state update shape — primitive, object, array, nested
- How to recognise and fix a mutation bug in the wild

---

## Why Immutability — The Actual Reason

React decides whether to re-render by comparing state references. When you call `setState`, React checks: is this a different object/array than what was there before?

```js
const prev = { steps: 0 };
const next = prev;        // same reference
next.steps = 500;

console.log(prev === next); // true — same object in memory
```

If you mutate and hand the same reference back, React sees no change and skips the re-render. Your state changed in memory, but the UI doesn't update. This is the core bug mutation causes — silent, invisible, and hard to trace because `console.log(state)` shows the updated value (it's reading live memory), making you think the state did update.

```js
// ✅ New reference — React detects the change, triggers re-render
const next = { ...prev, steps: 500 };
console.log(prev === next); // false — different object
```

This is the entire reason for the immutability requirement. It's not philosophical or stylistic — it's mechanically necessary for React's diffing algorithm to work correctly.

---

## The Complete Update Pattern Toolkit

Everything from previous chapters — spread (Ch. 5), `map()` (Ch. 13), `filter()` (Ch. 14) — comes together here as a complete, practical reference.

### Primitives — just set them directly

```js
const [count, setCount] = useState(0);
const [name, setName] = useState("");

setCount(5);          // ✅ numbers, strings, booleans — primitives are always new values
setName("Subrata");   // ✅ no spread needed, they're not objects
```

Primitives are compared by value, not reference — `5 === 5` is always `true`. No mutation is possible here; this section exists only to confirm: yes, setters on primitives are genuinely just `setState(newValue)`.

---

### Objects — spread and override

```js
const [profile, setProfile] = useState({ name: "Subrata", steps: 0, city: "Bengaluru" });

// Update one field
setProfile(prev => ({ ...prev, steps: 500 }));

// Update multiple fields at once
setProfile(prev => ({ ...prev, steps: 500, city: "Mumbai" }));
```

`...prev` copies every field, then the override(s) at the end win. One `setState` call per logical update — don't chain multiple `setState` calls to update different fields; batch them in one spread.

---

### Nested objects — spread at every changed level

```js
const [user, setUser] = useState({
  name: "Subrata",
  stats: { steps: 0, calories: 0 },
  address: { city: "Bengaluru", country: "India" },
});

// ✅ Spread at every level you're changing
setUser(prev => ({
  ...prev,
  stats: {
    ...prev.stats,
    steps: 500,   // only steps changes; calories is preserved via ...prev.stats
  },
}));
```

The shallow-copy caveat from Chapter 5: spread only copies one level. If you spread `user` but not `stats`, `stats` is still the same reference as before — mutating it later would affect the "old" state object too.

---

### Arrays — adding, removing, updating items

**Add to end:**

```js
const [logs, setLogs] = useState([]);

setLogs(prev => [...prev, newLog]);
```

**Add to start:**

```js
setLogs(prev => [newLog, ...prev]);
```

**Remove by id:**

```js
setLogs(prev => prev.filter(log => log.id !== idToRemove));
```

**Update one item by id:**

```js
setLogs(prev =>
  prev.map(log =>
    log.id === idToUpdate
      ? { ...log, calories: 450 }  // new object for the changed item
      : log                         // same reference for everything else
  )
);
```

This is the full immutable update for a single item in an array. `map()` returns a new array; the spread inside creates a new object for the matched item; everything else passes through unchanged.

**Replace the entire array:**

```js
setLogs(apiResponse.data); // ✅ if the source is already a new array
```

---

### Nested arrays inside objects

```js
const [workout, setWorkout] = useState({
  id: "w1",
  name: "Morning Routine",
  exercises: ["pushups", "squats"],
});

// Add an exercise
setWorkout(prev => ({
  ...prev,
  exercises: [...prev.exercises, "lunges"],
}));

// Remove an exercise
setWorkout(prev => ({
  ...prev,
  exercises: prev.exercises.filter(e => e !== "squats"),
}));
```

Spread the outer object, then apply the array update to the specific array field — combining patterns from above.

---

## Recognising Mutation in the Wild

These are the patterns to catch in code review — each looks plausible but mutates:

```js
// ❌ Direct property assignment
state.steps = 500;

// ❌ Array push
state.logs.push(newLog);

// ❌ Array splice
state.logs.splice(0, 1);

// ❌ sort() mutates in place
state.logs.sort((a, b) => a.date - b.date);

// ❌ Object.assign into the original
Object.assign(state, { steps: 500 });
```

`sort()` is the sneaky one. It's the only common array method that mutates in place rather than returning a new array:

```js
// ❌ Mutates the original array
const sorted = logs.sort((a, b) => a.date - b.date);

// ✅ Spread first to create a copy, then sort
const sorted = [...logs].sort((a, b) => a.date - b.date);
```

---

## When State Gets Complex: `useReducer`

When you find yourself writing many nested spread updates, or multiple fields always change together, `useReducer` is often a cleaner shape than `useState`:

```js
const workoutReducer = (state, action) => {
  switch (action.type) {
    case "ADD_LOG":
      return { ...state, logs: [...state.logs, action.payload] };

    case "REMOVE_LOG":
      return { ...state, logs: state.logs.filter(l => l.id !== action.payload) };

    case "UPDATE_STATS":
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };

    default:
      return state;
  }
};

const [state, dispatch] = useReducer(workoutReducer, {
  logs: [],
  stats: { calories: 0, steps: 0 },
});

// Dispatching is now intent-first and easy to read at the call site
dispatch({ type: "ADD_LOG", payload: newLog });
dispatch({ type: "UPDATE_STATS", payload: { calories: 320 } });
```

`useReducer` doesn't change the immutability requirement — the reducer must still return new objects. What it changes is the *shape* of the code: all mutation logic is centralized in one function instead of scattered across event handlers.

Rule of thumb: `useState` for one or two simple values; `useReducer` when state has multiple sub-fields that update together, or when the update logic is complex enough to benefit from explicit action names.

---

## What This Looks Like in React Native — Full Component

```jsx
import React, { useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';

const WorkoutLogger = () => {
  const [workout, setWorkout] = useState({
    name: "Today's Session",
    logs: [],
    stats: { totalCalories: 0, totalDuration: 0 },
  });

  const addLog = (entry) => {
    setWorkout(prev => ({
      ...prev,
      logs: [...prev.logs, { ...entry, id: Date.now().toString() }],
      stats: {
        totalCalories: prev.stats.totalCalories + entry.calories,
        totalDuration: prev.stats.totalDuration + entry.duration,
      },
    }));
  };

  const removeLog = (id) => {
    setWorkout(prev => {
      const removed = prev.logs.find(l => l.id === id);
      return {
        ...prev,
        logs: prev.logs.filter(l => l.id !== id),
        stats: {
          totalCalories: prev.stats.totalCalories - (removed?.calories ?? 0),
          totalDuration: prev.stats.totalDuration - (removed?.duration ?? 0),
        },
      };
    });
  };

  return (
    <View>
      <Text>{workout.name}</Text>
      <Text>{`Total calories: ${workout.stats.totalCalories}`}</Text>
      <FlatList
        data={workout.logs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Button title="Remove" onPress={() => removeLog(item.id)} />
          </View>
        )}
      />
      <Button
        title="Add Run"
        onPress={() => addLog({ name: "Run", calories: 320, duration: 30 })}
      />
    </View>
  );
};
```

Every state update here creates new references at every changed level — the outer `workout` object, `logs` array, and `stats` object — while leaving unchanged fields pointing to the same references. React detects each change correctly, rerenders exactly what changed, and nothing mutates.

---

## Common Mistakes

**Mistake 1: Mutating then setting — the silent no-render bug**

```js
// ❌ Mutates the existing object, passes back the same reference
setProfile(prev => {
  prev.steps = 500; // mutation!
  return prev;      // same reference — React sees no change, skips re-render
});

// ✅ Return a new object
setProfile(prev => ({ ...prev, steps: 500 }));
```

**Mistake 2: Forgetting to spread on nested updates**

```js
// ❌ Shallow spread — stats is still the old reference
setUser(prev => ({
  ...prev,
  stats: { steps: 500 }, // lost calories! overwrites the whole stats object
}));

// ✅ Spread the nested object too
setUser(prev => ({
  ...prev,
  stats: { ...prev.stats, steps: 500 },
}));
```

**Mistake 3: Sorting state in place**

```js
// ❌ sort() mutates — logs in state is now sorted, but React didn't see a new reference
setLogs(prev => {
  prev.sort((a, b) => a.date - b.date);
  return prev;
});

// ✅ Copy first
setLogs(prev => [...prev].sort((a, b) => a.date - b.date));
```

---

## Quick Recap

| Update Type | Correct Pattern |
|-------------|-----------------|
| Primitive | `setState(newValue)` |
| Object field | `prev => ({ ...prev, field: newValue })` |
| Nested object field | `prev => ({ ...prev, inner: { ...prev.inner, field: newValue } })` |
| Add to array | `prev => [...prev, newItem]` |
| Remove from array | `prev => prev.filter(item => item.id !== id)` |
| Update one array item | `prev => prev.map(item => item.id === id ? { ...item, field: val } : item)` |
| Sort array | `prev => [...prev].sort(compareFn)` |

---

## Up Next

**Chapter 17 — `Object.keys`, `values`, and `entries`: Iterating API Responses**

You've seen `Object.entries()` briefly in Chapter 15's `SectionList` example. Chapter 17 covers all three — `keys`, `values`, `entries` — with real examples of iterating API response shapes, converting between objects and arrays, and the patterns behind settings screens and dynamic form rendering in RN.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
