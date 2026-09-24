# Chapter 9 — Closures Explained with a Real `useCallback` Example

> **Module 2 · Lesson 2 of 5** | 📘 Concept · 🎬 Demo | ⏱ 10 min

---

## What You'll Learn

- What a closure actually is, in plain terms
- Why closures explain how React hooks "remember" things between renders
- The stale closure bug — the single most confusing bug in functional RN components
- How `useCallback` relates to closures, and when you actually need it

---

## What Is a Closure?

A closure is what happens when a function "remembers" the variables from the scope it was created in — even after that outer scope has finished running.

```js
function makeCounter() {
  let count = 0;

  return function increment() {
    count = count + 1;
    return count;
  };
}

const counter = makeCounter();

console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

`makeCounter()` runs and returns. Normally, `count` would be gone — garbage collected, out of scope. But the returned `increment` function still has access to it. That's a closure: the inner function "closed over" the variable from its birth scope and kept a live reference to it.

Every time you call `counter()`, it's reading and updating the *same* `count` — not a fresh one. This is the entire mechanism. Nothing more exotic than that.

---

## Closures Are Everywhere in RN — You've Already Used Them

Every event handler you've written in this course is a closure:

```jsx
const StepCounter = () => {
  const [steps, setSteps] = useState(0);

  const handlePress = () => {
    setSteps(steps + 1); // this function "closes over" `steps` from this render
  };

  return <Button title="Add Step" onPress={handlePress} />;
};
```

`handlePress` is defined inside `StepCounter`. It has access to `steps` because of closure — exactly like `increment` had access to `count`. Nothing new syntactically. What's new is understanding the consequence of this inside a component that **re-renders**.

---

## The Critical Twist: Every Render Creates a New Closure

This is the part that trips people up. A functional component is just a function. **Every time it re-renders, the entire function body runs again** — including every inline function defined inside it.

```jsx
const StepCounter = () => {
  const [steps, setSteps] = useState(0);

  // A brand new `handlePress` function is created on every single render,
  // each one closing over that render's specific value of `steps`.
  const handlePress = () => {
    console.log(`Current steps: ${steps}`);
    setSteps(steps + 1);
  };

  return <Button title="Add Step" onPress={handlePress} />;
};
```

Render 1: `steps` is `0`. `handlePress` closes over `0`.
Render 2 (after a click): `steps` is `1`. A *new* `handlePress` closes over `1`.

Each render gets its own snapshot. This is normally invisible and fine — React calls the *latest* `handlePress` on every click. But it becomes a real bug the moment a closure outlives the render it was created in.

---

## The Stale Closure Bug

This is the most common closure-related bug in React Native, and it usually shows up with `setTimeout`, `setInterval`, or event listeners.

```jsx
const StepCounter = () => {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`Steps: ${steps}`); // ❌ always logs 0
    }, 1000);

    return () => clearInterval(interval);
  }, []); // empty dependency array — effect runs once

  return (
    <Button title="Add Step" onPress={() => setSteps(s => s + 1)} />
  );
};
```

**What's actually happening:** the `useEffect` with `[]` runs exactly once — on the first render, when `steps` is `0`. The `setInterval` callback closes over *that* render's `steps`, which is permanently `0`. Even as the user taps the button and `steps` updates in state, this particular closure inside the interval never sees the update — it's stuck looking at the value from the render it was born in.

This is called a **stale closure**. The function is "stale" because it's holding onto an old snapshot instead of the current one.

### The Fix

```jsx
useEffect(() => {
  const interval = setInterval(() => {
    setSteps(current => {
      console.log(`Steps: ${current}`); // ✅ always current
      return current;
    });
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

The functional update form (`current => ...`, from Chapter 5) sidesteps the problem entirely — React always passes the *true current* state into that callback, regardless of which closure is calling it. You don't need `steps` in the dependency array at all.

---

## Where `useCallback` Comes In

`useCallback` doesn't prevent stale closures by itself — it controls **when a new closure is created**, which is a related but separate concern: performance.

```jsx
const StepCounter = ({ onMilestone }) => {
  const [steps, setSteps] = useState(0);

  // Without useCallback: a brand new function every render,
  // even if `steps` and `onMilestone` haven't changed
  const handlePress = () => {
    const next = steps + 1;
    setSteps(next);
    if (next % 1000 === 0) onMilestone(next);
  };

  return <Button title="Add Step" onPress={handlePress} />;
};
```

If `handlePress` is passed down to a memoized child component (`React.memo`), a new function reference every render defeats the memoization — the child re-renders anyway, because `handlePress !== handlePress` from the previous render (different closures, different references).

```jsx
const StepCounter = ({ onMilestone }) => {
  const [steps, setSteps] = useState(0);

  const handlePress = useCallback(() => {
    setSteps(current => {
      const next = current + 1;
      if (next % 1000 === 0) onMilestone(next);
      return next;
    });
  }, [onMilestone]);

  return <Button title="Add Step" onPress={handlePress} />;
};
```

`useCallback` returns the *same* function reference across renders, as long as the dependencies (`[onMilestone]`) haven't changed. React skips creating a new closure and reuses the previous one — which is exactly why getting the dependency array right matters so much. Get it wrong, and you'll either reintroduce a stale closure (missing dependency) or lose the performance benefit entirely (the function is recreated anyway because something unstable is in the array).

---

## The Dependency Array, Through the Closure Lens

Every hook with a dependency array (`useEffect`, `useCallback`, `useMemo`) is really asking one question:

> "Which outer-scope variables does this closure need to stay fresh on?"

```jsx
const handlePress = useCallback(() => {
  console.log(userId); // closes over `userId`
  setSteps(s => s + 1); // setSteps doesn't need to be a dependency — it's stable
}, [userId]); // must list userId, because the closure reads it directly
```

If `userId` changes and isn't in the array, `handlePress` keeps closing over the *old* `userId` — a stale closure, same root cause as the `setInterval` bug above. The ESLint rule `react-hooks/exhaustive-deps` exists specifically to catch this.

---

## What This Looks Like in React Native

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button } from 'react-native';

const HeartRateMonitor = ({ deviceId, onAlert }) => {
  const [bpm, setBpm] = useState(0);

  // Stable callback — only recreated if deviceId or onAlert changes
  const handleReading = useCallback((reading) => {
    setBpm(reading);
    if (reading > 180) {
      onAlert(deviceId, reading); // closes over deviceId — must be in deps
    }
  }, [deviceId, onAlert]);

  useEffect(() => {
    const subscription = BLEDevice.onReading(deviceId, handleReading);
    return () => subscription.remove();
  }, [deviceId, handleReading]); // handleReading itself must be listed —
                                  // it's a closure too, and the effect uses it

  return (
    <View>
      <Text>{`BPM: ${bpm}`}</Text>
    </View>
  );
};
```

This is realistic BLE-integration code — the exact kind you've debugged on the spirometry app. `handleReading` is a closure that depends on `deviceId` and `onAlert`. The `useEffect` that subscribes to the device depends on `handleReading` itself, because effects close over whatever functions they call, just like any other closure.

---

## Common Mistakes

**Mistake 1: Reading state directly inside `setInterval`/`setTimeout` instead of using functional updates**

```js
// ❌ Stale closure — count is frozen at the value from when the interval started
setInterval(() => setCount(count + 1), 1000);

// ✅ Always reads current state
setInterval(() => setCount(c => c + 1), 1000);
```

**Mistake 2: Omitting a dependency because "it works in testing"**

```jsx
// ❌ Works by luck during quick manual testing, breaks once userId actually changes
const fetchData = useCallback(() => {
  api.getUser(userId);
}, []); // userId missing!

// ✅ Correct
const fetchData = useCallback(() => {
  api.getUser(userId);
}, [userId]);
```

**Mistake 3: Wrapping every function in `useCallback` "just in case"**

```jsx
// ❌ Unnecessary — this isn't passed to a memoized child or used in another hook's deps
const handlePress = useCallback(() => setSteps(s => s + 1), []);

// ✅ Plain function is fine — useCallback only pays off when reference stability matters
const handlePress = () => setSteps(s => s + 1);
```

`useCallback` itself has a small cost (memory for the cached function and dependency comparison on every render). Reach for it when passing callbacks to `React.memo` children or other hooks' dependency arrays — not by default on everything.

---

## Quick Recap

| Concept | What It Means |
|---------|----------------|
| Closure | A function that retains access to variables from its defining scope |
| Every render = new closures | Functions defined inside a component are recreated every render |
| Stale closure | A closure holding an outdated snapshot of state/props from a past render |
| Functional state updates | `setX(prev => ...)` sidesteps stale closures for state reads |
| `useCallback` | Reuses the same function reference across renders, based on a dependency array |
| Dependency array | Lists every outer-scope value the closure reads — get it wrong, get a stale closure |

---

## Up Next

**Chapter 10 — The Event Loop: Why `setTimeout` Behaves Oddly in RN**

You just saw `setInterval` cause a stale closure bug. Chapter 10 goes one layer deeper — how JavaScript actually schedules `setTimeout`/`setInterval` callbacks, why "0ms" doesn't mean "now," and what's different about timers in the React Native JS engine versus a browser.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
