# Chapter 10 — The Event Loop: Why `setTimeout` Behaves Oddly in RN

> **Module 2 · Lesson 3 of 5** | 📘 Concept | ⏱ 8 min

---

## What You'll Learn

- What the event loop actually is, and why JS needs one
- Why `setTimeout(fn, 0)` doesn't run "now"
- The call stack, task queue, and microtask queue — and the order they run in
- What's genuinely different about timers in React Native's JS engine vs a browser

---

## JavaScript Is Single-Threaded

JavaScript runs on one thread. One thing happens at a time — there's no true parallel execution of your JS code. That single thread is called the **call stack**: a record of what function is currently running and what called it.

```js
function a() { b(); }
function b() { c(); }
function c() { console.log("done"); }

a();
```

Call stack grows: `a` → `b` → `c`. `c` logs, returns, then `b` returns, then `a` returns. Stack empties. Nothing runs concurrently with this — if `c` took five seconds, your entire app — UI included — would freeze for five seconds.

So how does `setTimeout`, a network request, or a button tap get handled without blocking everything? That's the event loop.

---

## The Three Pieces

**1. Call Stack** — where your synchronous code actually executes, one frame at a time.

**2. Task Queue (a.k.a. macrotask queue)** — where callbacks wait: `setTimeout`, `setInterval`, UI events, BLE data callbacks.

**3. Microtask Queue** — where Promise callbacks (`.then`, `async`/`await` continuations) wait. Higher priority than the task queue.

**The Event Loop** is the mechanism constantly checking: *"Is the call stack empty? If so, take the next thing from the microtask queue. If that's empty too, take the next thing from the task queue."*

This is the entire model. `setTimeout` doesn't pause your code — it hands a callback to the task queue and moves on immediately. The callback only runs once the call stack is completely empty and it's its turn.

---

## Why `setTimeout(fn, 0)` Doesn't Mean "Now"

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");

// Output: 1, 3, 2
```

Even with a `0ms` delay, `setTimeout`'s callback goes into the task queue. It can't run until the *current* synchronous code finishes and the call stack is empty. `console.log("3")` is still on the stack when `setTimeout` fires, so it runs first.

`0ms` doesn't mean "immediately." It means "as soon as possible, but only after everything currently running finishes." This single fact resolves most of the "why did my timeout not fire when I expected" confusion.

---

## Microtasks Beat Macrotasks

```js
console.log("1");

setTimeout(() => console.log("2 - setTimeout"), 0);

Promise.resolve().then(() => console.log("3 - promise"));

console.log("4");

// Output: 1, 4, 3 - promise, 2 - setTimeout
```

Order of operations:
1. `console.log("1")` runs synchronously.
2. `setTimeout` schedules its callback into the **task** queue.
3. `Promise.resolve().then()` schedules its callback into the **microtask** queue.
4. `console.log("4")` runs synchronously.
5. Call stack is empty. Event loop checks the **microtask** queue first — runs the Promise callback.
6. Microtask queue is empty. Event loop checks the **task** queue — runs the `setTimeout` callback.

**The rule:** after every synchronous block finishes, all pending microtasks run before the next task (including `setTimeout`) gets a turn — every time, no exceptions. This is why `async`/`await` (Chapter 11) tends to "feel faster" than chained `setTimeout` calls for sequencing logic — Promises consistently jump the queue ahead of timers.

---

## What's Actually Different in React Native

The event loop model above is universal JavaScript — same in a browser, Node, or RN. What changes in React Native is **what's around it**.

### No browser, no DOM event loop tied to 60fps rendering

In a browser, `setTimeout` competes with the browser's own rendering and layout work, which is tightly bound to the display's refresh rate. React Native's JS thread is separate from the **UI thread** — they communicate via a bridge (old architecture) or directly via JSI (New Architecture, which your healthcare project is migrating to). A `setTimeout` firing doesn't block native UI rendering the way it can momentarily affect a browser's paint cycle, but it still competes for time on the **JS thread**, where all your component logic, state updates, and `setState` calls run.

### Timer throttling/backgrounding behaves differently

Browsers throttle `setTimeout` heavily in inactive background tabs (sometimes capping to once per second or worse). React Native apps backgrounded on iOS/Android have their own OS-level suspension rules — timers can be paused entirely when the app isn't in the foreground, and `setInterval` callbacks scheduled before backgrounding may fire in a burst or get dropped depending on platform and how long the app was backgrounded. Never rely on `setTimeout`/`setInterval` for anything time-critical (like a real countdown that must stay accurate) without accounting for this — use timestamps and recompute elapsed time instead of trusting tick counts.

### Minimum delay clamping

Both browsers and RN's JS engine enforce a practical minimum delay for nested or repeated timers (historically ~4ms in browsers; RN's behavior depends on the JS engine — Hermes, by default, in most current RN apps). `setTimeout(fn, 0)` is never truly zero-cost. Don't write logic that depends on sub-millisecond precision from `setTimeout`.

---

## What This Looks Like in React Native

### 1. Debounced search — relying on task queue ordering

```js
const useDebouncedSearch = (query, delay = 300) => {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), delay);
    return () => clearTimeout(timeout); // cancels the pending task if query changes again
  }, [query, delay]);

  return debounced;
};
```

Every keystroke schedules a new timeout and cancels the previous one via the cleanup function. Because `clearTimeout` removes the callback from the task queue before it ever runs, only the *last* keystroke's timeout actually fires — the classic debounce pattern, entirely dependent on understanding the task queue.

### 2. A countdown that doesn't drift — timestamp-based, not tick-based

```js
const useCountdown = (totalSeconds) => {
  const [remaining, setRemaining] = useState(totalSeconds);
  const endTimeRef = useRef(Date.now() + totalSeconds * 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      const secondsLeft = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000)
      );
      setRemaining(secondsLeft);
      if (secondsLeft === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return remaining;
};
```

This doesn't trust `setInterval` to fire exactly every 1000ms — it recalculates from an absolute end timestamp every tick. Crucial in RN: if the app gets backgrounded for 10 seconds and the interval callback only fires once after resuming, this still reports the *correct* remaining time, because it's based on real elapsed time, not a counted number of ticks.

### 3. Yielding to let UI updates flush before heavy work

```js
const processLargeDataset = (data) => {
  setLoading(true);

  // setTimeout 0 pushes the heavy work to the next task —
  // giving the JS thread a chance to flush the `loading` state update first
  setTimeout(() => {
    const result = heavyComputation(data);
    setResults(result);
    setLoading(false);
  }, 0);
};
```

Without the `setTimeout`, `heavyComputation` would run synchronously inside the same call stack as `setLoading(true)`, so the spinner would never get a chance to actually render before the thread gets blocked by the heavy work. Pushing it to the task queue lets the pending state update commit first.

---

## Common Mistakes

**Mistake 1: Assuming `setTimeout(fn, 0)` runs before the next line**

```js
let value = "before";
setTimeout(() => { value = "after"; }, 0);
console.log(value); // "before" — always, no exceptions
```

**Mistake 2: Using `setInterval` tick count for anything time-accurate**

```js
// ❌ Drifts, and breaks entirely if the app backgrounds
let seconds = 0;
setInterval(() => { seconds++; }, 1000);

// ✅ Compute from real elapsed time instead (see useCountdown above)
```

**Mistake 3: Forgetting to clear timers in cleanup**

```jsx
// ❌ Leaks — timer keeps running and may reference a stale closure
// or set state on an unmounted component
useEffect(() => {
  setInterval(() => doSomething(), 1000);
}, []);

// ✅ Always clean up
useEffect(() => {
  const id = setInterval(() => doSomething(), 1000);
  return () => clearInterval(id);
}, []);
```

---

## Quick Recap

| Term | What It Is |
|------|------------|
| Call stack | Where synchronous code actually executes, one function at a time |
| Task queue | Where `setTimeout`/`setInterval`/event callbacks wait their turn |
| Microtask queue | Where Promise callbacks wait — always runs before the next task |
| Event loop | The loop that moves work from queues onto the empty call stack |
| `setTimeout(fn, 0)` | Means "next available task slot," never "immediately" |
| RN-specific risk | Backgrounding can pause/drop timers — don't trust tick counts for real time |

---

## Up Next

**Chapter 11 — Promises & `async`/`await`: Fetching Data in React Native**

You now understand why the microtask queue exists and why it jumps ahead of `setTimeout`. Chapter 11 builds directly on that: Promises are what live in the microtask queue, and `async`/`await` is the syntax that makes working with them readable. This is the pattern behind every API call you'll write in RN.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
