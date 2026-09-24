# Chapter 11 — Promises & `async`/`await`: Fetching Data in React Native

> **Module 2 · Lesson 4 of 5** | 📘 Concept · 🎬 Demo | ⏱ 12 min

---

## What You'll Learn

- What a Promise actually represents, and its three states
- Why `async`/`await` exists — and that it's just syntax over Promises
- The standard data-fetching pattern in React Native
- `Promise.all` for running multiple requests concurrently

---

## What a Promise Represents

A Promise is an object representing a value that isn't available yet, but will be — eventually, either successfully or with an error.

A Promise has exactly three states:

- **Pending** — the operation hasn't finished yet
- **Fulfilled** — it finished successfully, with a result value
- **Rejected** — it finished with an error

```js
const promise = new Promise((resolve, reject) => {
  // some async operation
  const success = true;

  if (success) {
    resolve("Data loaded");
  } else {
    reject(new Error("Failed to load"));
  }
});
```

You rarely construct Promises by hand in RN — `fetch`, most native module bridges, and most third-party SDKs already return Promises. What you'll write constantly is code that *consumes* them.

---

## Consuming a Promise: `.then()` / `.catch()`

```js
fetch("https://api.healthapp.com/users/u_123/steps")
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.log("Failed:", error.message);
  });
```

Each `.then()` runs once the previous step resolves, and can return a new value (or another Promise) for the next `.then()` in the chain. `.catch()` catches a rejection from anywhere earlier in the chain.

This works, but chains get hard to read once there's real logic involved — conditionals, loops, multiple sequential calls. That's the problem `async`/`await` solves.

---

## `async`/`await` — Same Thing, Readable Syntax

```js
const fetchSteps = async () => {
  try {
    const response = await fetch("https://api.healthapp.com/users/u_123/steps");
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log("Failed:", error.message);
  }
};
```

Two rules:

1. `async` before a function marks it as one that returns a Promise and can use `await` inside it.
2. `await` pauses execution of *that function* until the Promise resolves, then gives you the resolved value directly — no `.then()` needed.

**Important:** `await` doesn't block the whole app. It only pauses the `async` function it's inside. Everything else — UI rendering, other code — keeps running. This connects directly to Chapter 10: under the hood, `await` is built on the microtask queue. The rest of your synchronous code finishes, then the awaited Promise's continuation runs as a microtask once it resolves.

`async`/`await` is not a different technology from Promises — it's syntax that makes Promise chains read like sequential, synchronous-looking code. Every `async` function still returns a Promise; every `await` is still waiting on one.

---

## What This Looks Like in React Native

### 1. The standard fetch-on-mount pattern

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const StepsScreen = ({ userId }) => {
  const [steps, setSteps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSteps = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/users/${userId}/steps`);
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const data = await response.json();
        setSteps(data.steps);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSteps();
  }, [userId]);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>{`Error: ${error}`}</Text>;

  return <Text>{`Steps: ${steps}`}</Text>;
};
```

A few things worth noticing:

- `useEffect`'s callback can't be `async` directly — React expects either nothing or a cleanup function returned, not a Promise. So the `async` function is defined *inside* the effect and called immediately (`loadSteps()`).
- `finally` runs whether the request succeeds or fails — perfect for `setLoading(false)`, since you want the spinner gone either way.
- `userId` is in the dependency array — if it changes, the effect re-runs and fetches fresh data. This is the same closure-correctness concern from Chapter 9: the `loadSteps` closure reads `userId`, so it must be listed.

### 2. Sequential awaits — one depends on the previous result

```js
const syncWorkoutData = async (userId) => {
  const profile = await fetchUserProfile(userId);
  const goals = await fetchGoals(profile.goalSetId); // needs profile's result
  const summary = await calculateSummary(goals);
  return summary;
};
```

Each `await` genuinely waits for the line above, because each step needs the previous step's output. This is the correct use of sequential `await` — when there's a real data dependency.

### 3. Concurrent awaits — independent requests, run them in parallel

```js
// ❌ Slow — these three requests don't depend on each other,
// but awaiting one-by-one makes them run sequentially
const loadDashboard = async (userId) => {
  const steps = await fetchSteps(userId);
  const heartRate = await fetchHeartRate(userId);
  const sleep = await fetchSleep(userId);
  return { steps, heartRate, sleep };
};

// ✅ Fast — fire all three requests at once, wait for all to finish together
const loadDashboard = async (userId) => {
  const [steps, heartRate, sleep] = await Promise.all([
    fetchSteps(userId),
    fetchHeartRate(userId),
    fetchSleep(userId),
  ]);
  return { steps, heartRate, sleep };
};
```

`Promise.all` takes an array of Promises and resolves once *all* of them resolve, returning their results in the same order (array destructuring from Chapter 4 again). If any one of them rejects, `Promise.all` rejects immediately with that error — useful to know, and the reason Chapter 12 covers error handling for exactly this case.

The sequential version above isn't wrong, just slower — if each request takes 500ms, sequential is ~1500ms total, while `Promise.all` is ~500ms total (bounded by the slowest one).

---

## A BLE-Flavored Example

Native module calls that return Promises follow the same pattern:

```js
const connectToDevice = async (deviceId) => {
  try {
    const device = await BleManager.connect(deviceId);
    const services = await device.discoverServices();
    const characteristic = await services.getCharacteristic(SPIRO_UUID);
    return characteristic;
  } catch (error) {
    console.log(`BLE connection failed: ${error.message}`);
    throw error; // re-throw so the calling code can also handle it
  }
};
```

Each step depends on the previous one's resolved value — exactly the sequential-awaits pattern. This is the realistic shape of device-pairing code you'd write for a spirometry or smart-scale integration.

---

## Common Mistakes

**Mistake 1: Awaiting independent requests sequentially**

```js
// ❌ Three round trips, one after another, for no reason
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();

// ✅ Same data, roughly 3x faster
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
```

**Mistake 2: Forgetting `async` functions always return a Promise — even on errors**

```js
const fetchData = async () => {
  return 42;
};

const result = fetchData();
console.log(result); // Promise { 42 } — NOT 42 directly!
console.log(await fetchData()); // 42 — correct
```

Easy to forget when refactoring a synchronous function into an async one — every call site now needs `await` (or `.then()`) to get the actual value.

**Mistake 3: Passing an `async` function directly to `useEffect`**

```jsx
// ❌ React warns: effect callbacks must be synchronous or return a cleanup function,
// not a Promise
useEffect(async () => {
  const data = await fetchSteps();
  setSteps(data);
}, []);

// ✅ Define the async function inside, then call it
useEffect(() => {
  const load = async () => {
    const data = await fetchSteps();
    setSteps(data);
  };
  load();
}, []);
```

---

## Quick Recap

| Concept | What It Means |
|---------|----------------|
| Promise | An object representing a value not yet available — pending, fulfilled, or rejected |
| `.then()` / `.catch()` | Original Promise consumption syntax — chains, but gets messy with real logic |
| `async` function | A function that implicitly returns a Promise and can use `await` inside |
| `await` | Pauses *that function* until a Promise resolves, returning the resolved value |
| Sequential `await` | Use when each step genuinely needs the previous step's result |
| `Promise.all` | Runs independent Promises concurrently, resolves once all finish |
| `useEffect` + async | Define the `async` function inside the effect, call it immediately — never pass `async` directly to `useEffect` |

---

## Up Next

**Chapter 12 — Error Handling with `try`/`catch` in Async Functions**

You've already used `try`/`catch`/`finally` in this chapter's examples without a deep dive. Chapter 12 covers it properly — including the `Promise.all` all-or-nothing failure mode, distinguishing network errors from API error responses, and the error-handling pattern your BLE and healthcare-data code actually needs in production.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
