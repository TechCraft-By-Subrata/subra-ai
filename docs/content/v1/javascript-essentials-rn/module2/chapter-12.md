# Chapter 12 — Error Handling with `try`/`catch` in Async Functions

> **Module 2 · Lesson 5 of 5** | 📘 Concept · 🏋️ Exercise | ⏱ 10 min

---

## What You'll Learn

- `try`/`catch`/`finally` syntax and how each block actually behaves
- Why `fetch` doesn't reject on HTTP error status codes — and why that catches people off guard
- How `Promise.all` fails all-or-nothing, and the `Promise.allSettled` alternative
- A production-grade error handling pattern for RN API and BLE calls

---

## `try`/`catch`/`finally`, Properly

You've used this already in Chapter 11's examples. Here's the precise behavior:

```js
const loadData = async () => {
  try {
    const data = await fetchSteps();
    console.log(data);
  } catch (error) {
    console.log("Something went wrong:", error.message);
  } finally {
    console.log("This always runs — success or failure");
  }
};
```

- **`try`** — code that might throw or reject runs here.
- **`catch`** — runs only if something inside `try` throws an error or an `await`ed Promise rejects. The error is caught and assigned to the variable (`error` here, name is up to you).
- **`finally`** — runs unconditionally, whether `try` succeeded or `catch` fired. Perfect for cleanup that must always happen — hiding a spinner, releasing a lock, closing a BLE connection.

If you `await` a rejected Promise inside `try`, it behaves exactly like a `throw` — execution jumps straight to `catch`. This is the entire mechanism that lets async code use the same error-handling shape as synchronous code.

---

## The `fetch` Trap: HTTP Errors Don't Reject

This catches almost everyone the first time.

```js
const loadData = async () => {
  try {
    const response = await fetch(`${BASE_URL}/users/invalid_id/steps`);
    const data = await response.json();
    console.log(data); // this still runs, even on a 404!
  } catch (error) {
    console.log("Caught:", error.message); // never reached for HTTP errors
  }
};
```

`fetch`'s Promise only rejects on genuine network failures — no connection, DNS failure, request aborted. A `404 Not Found` or `500 Internal Server Error` is still a *successful* HTTP round trip as far as `fetch` is concerned — the server responded, just with a bad status. `catch` never fires for it.

You must check `response.ok` (or `response.status`) yourself and throw manually:

```js
const loadData = async () => {
  try {
    const response = await fetch(`${BASE_URL}/users/invalid_id/steps`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log("Caught:", error.message); // now correctly catches the 404 too
  }
};
```

This single `if (!response.ok) throw new Error(...)` line is one of the most commonly missing lines in real-world RN API code — and one of the most common sources of "the app shows a blank screen instead of an error message" bugs.

---

## `Promise.all` Fails All-or-Nothing

From Chapter 11 — `Promise.all` runs requests concurrently. Here's its failure behavior:

```js
const loadDashboard = async (userId) => {
  try {
    const [steps, heartRate, sleep] = await Promise.all([
      fetchSteps(userId),
      fetchHeartRate(userId), // suppose this one fails
      fetchSleep(userId),
    ]);
    return { steps, heartRate, sleep };
  } catch (error) {
    // If even ONE of the three rejects, Promise.all rejects immediately —
    // you lose the results of the other two, even if they succeeded
    console.log("Dashboard load failed:", error.message);
  }
};
```

If `fetchHeartRate` fails, `Promise.all` rejects right away — even if `fetchSteps` and `fetchSleep` already succeeded. You get nothing back, not even the two that worked. For a dashboard where partial data is better than no data, this is usually the wrong behavior.

### The Fix: `Promise.allSettled`

```js
const loadDashboard = async (userId) => {
  const results = await Promise.allSettled([
    fetchSteps(userId),
    fetchHeartRate(userId),
    fetchSleep(userId),
  ]);

  const [stepsResult, heartRateResult, sleepResult] = results;

  return {
    steps: stepsResult.status === "fulfilled" ? stepsResult.value : null,
    heartRate: heartRateResult.status === "fulfilled" ? heartRateResult.value : null,
    sleep: sleepResult.status === "fulfilled" ? sleepResult.value : null,
  };
};
```

`Promise.allSettled` never rejects. It always resolves, with an array describing the outcome of *every* Promise — `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`. You decide what to do with each result individually, including showing partial data when one source fails.

**Rule of thumb:** use `Promise.all` when you genuinely need every result or none (e.g., submitting a form that requires three related writes to all succeed). Use `Promise.allSettled` when partial success is acceptable (e.g., a dashboard with independent widgets).

---

## What This Looks Like in React Native

### A production-grade fetch hook with proper error handling

```jsx
import { useState, useEffect, useCallback } from 'react';

const useApiData = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      // Distinguish network failure from a parsing failure if useful
      setError(err.message ?? "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, retry: load };
};
```

This single hook handles loading state, the `fetch`-doesn't-reject-on-404 trap, and exposes a `retry` function — reusable across any screen that fetches from your API.

### BLE error handling — distinguishing failure types

```js
const connectAndReadSpirometer = async (deviceId) => {
  try {
    const device = await BleManager.connect(deviceId);
    const reading = await device.readCharacteristic(SPIRO_UUID);
    return reading;
  } catch (error) {
    if (error.code === "DEVICE_DISCONNECTED") {
      throw new Error("Device disconnected — please reconnect and try again");
    }
    if (error.code === "TIMEOUT") {
      throw new Error("Device took too long to respond");
    }
    // Unknown error — re-throw as-is so it isn't silently swallowed
    throw error;
  }
};
```

Catching an error doesn't mean you have to handle it there. Sometimes the right move is to inspect it, translate it into something user-friendly, and **re-throw** — letting the calling component decide how to display it, rather than burying the real cause.

---

## 🏋️ Exercise

Given this broken function, find and fix every error-handling issue:

```js
const loadUserSummary = async (userId) => {
  const profile = await fetchProfile(userId);
  const steps = await fetchSteps(userId);
  const goals = await fetchGoals(userId);

  return { profile, steps, goals };
};
```

Requirements:
1. Wrap it properly so a failure in any call doesn't crash the app unhandled
2. `fetchProfile`, `fetchSteps`, and `fetchGoals` are independent — they should run concurrently, not sequentially
3. If `fetchProfile` specifically fails, the whole function should fail (no point showing a summary with no profile). If `fetchSteps` or `fetchGoals` fail, return `null` for that field but still show the rest

<details>
<summary>Solution</summary>

```js
const loadUserSummary = async (userId) => {
  try {
    const profile = await fetchProfile(userId); // critical — await separately, let it throw

    const [stepsResult, goalsResult] = await Promise.allSettled([
      fetchSteps(userId),
      fetchGoals(userId),
    ]);

    return {
      profile,
      steps: stepsResult.status === "fulfilled" ? stepsResult.value : null,
      goals: goalsResult.status === "fulfilled" ? goalsResult.value : null,
    };
  } catch (error) {
    // profile failed — this is treated as a hard failure
    throw new Error(`Could not load user summary: ${error.message}`);
  }
};
```

**Why this shape:** `fetchProfile` is awaited on its own outside `Promise.allSettled`, so its rejection naturally falls into `catch` and fails the whole function — matching requirement 3. The other two run concurrently via `Promise.allSettled`, so neither blocks the other, and either can fail independently without losing the rest of the data — matching requirements 2 and 3's softer half.

</details>

---

## Common Mistakes

**Mistake 1: Assuming `fetch` rejects on 404/500**

```js
// ❌ Silently "succeeds" with an error response body
const response = await fetch(url);
const data = await response.json();

// ✅ Always check response.ok first
const response = await fetch(url);
if (!response.ok) throw new Error(`Status ${response.status}`);
const data = await response.json();
```

**Mistake 2: Using `Promise.all` when partial results would be useful**

```js
// ❌ One failure loses everything
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);

// ✅ Get whatever succeeded
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
```

**Mistake 3: Swallowing errors silently**

```js
// ❌ Failure disappears completely — impossible to debug in production
try {
  await syncData();
} catch (error) {
  // empty catch block
}

// ✅ At minimum, log it — ideally surface it to the user or a crash reporting tool
try {
  await syncData();
} catch (error) {
  console.error("Sync failed:", error);
  setError("Could not sync your data. Please try again.");
}
```

---

## Quick Recap

| Concept | Behavior |
|---------|----------|
| `try`/`catch`/`finally` | `catch` fires on thrown errors or rejected `await`s; `finally` always runs |
| `fetch` and HTTP errors | `fetch` only rejects on network failure — check `response.ok` manually for 4xx/5xx |
| `Promise.all` | Rejects entirely if any one Promise rejects — use when all-or-nothing is correct |
| `Promise.allSettled` | Never rejects — returns per-Promise status, ideal for independent/partial data |
| Re-throwing | Catch, translate, and re-throw when the caller is better positioned to handle it |
| Empty `catch` blocks | Always a mistake — log or surface every caught error |

---

## Module 2 Complete 🎉

You've now covered the five concepts behind every hook, every API call, and every timer-based bug you'll encounter in React Native:

8. Default parameters & named arguments
9. Closures & `useCallback`
10. The event loop & `setTimeout`
11. Promises & `async`/`await`
12. Error handling with `try`/`catch`

This module is the foundation for understanding *why* hooks behave the way they do — not just how to call them.

---

## Up Next

**Module 3 — Arrays, Objects & Data Manipulation**

Next up: `map()`, `filter()`, `find()`, and `reduce()` — the array methods that power every `FlatList`, search bar, and aggregated stat screen you'll build. Then immutable state updates and `Object.keys`/`values`/`entries` for working with API response shapes.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
