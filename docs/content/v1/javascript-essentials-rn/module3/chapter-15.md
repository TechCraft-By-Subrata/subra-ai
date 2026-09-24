# Chapter 15 — `reduce()`: Aggregating Totals and Grouped Data

> **Module 3 · Lesson 3 of 6** | 📘 Concept · 🎬 Demo | ⏱ 10 min

---

## What You'll Learn

- What `reduce()` actually does, step by step
- How to use it for totals, counts, and max/min values
- How to reduce into an object — the grouped data pattern
- When `reduce()` is the right tool vs a simpler alternative

---

## What `reduce()` Does

`map()` transforms each item into something else — one-in, one-out.
`filter()` selects items — some in, fewer out.
`reduce()` collapses an entire array into **a single output value** — many in, one out. That one output can be a number, a string, an object, or even another array — whatever shape you need.

```js
const numbers = [1, 2, 3, 4, 5];

const total = numbers.reduce((accumulator, current) => {
  return accumulator + current;
}, 0);

console.log(total); // 15
```

Two parameters to understand:

1. **The callback** — called once per item, receives `(accumulator, currentItem)` and returns the new accumulator value.
2. **The initial value** — the starting value of `accumulator` (the `0` after the comma). Whatever type this is, that's the type `reduce()` will produce.

Walking through it:

| Call | `accumulator` | `current` | Returns |
|------|---------------|-----------|---------|
| 1st  | 0             | 1         | 1       |
| 2nd  | 1             | 2         | 3       |
| 3rd  | 3             | 3         | 6       |
| 4th  | 6             | 4         | 10      |
| 5th  | 10            | 5         | 15      |

After the last item, `reduce()` returns the final accumulator: `15`.

---

## Always Provide the Initial Value

`reduce()` has an optional initial value — if you skip it, it uses the first array element as the starting accumulator and starts iterating from the second. This works for simple number sums, but silently breaks for empty arrays and object accumulations:

```js
// ❌ Throws on empty array — no initial value, no first element to use
[].reduce((acc, n) => acc + n);

// ✅ Safe on empty arrays — returns 0
[].reduce((acc, n) => acc + n, 0);
```

Default rule: **always provide the initial value**. It makes the code's intent explicit and avoids edge case crashes.

---

## Common Aggregations

### Total

```js
const calories = [320, 150, 410];
const total = calories.reduce((acc, cal) => acc + cal, 0); // 880
```

### Count of matching items

```js
const workouts = [
  { name: "Run", completed: true },
  { name: "Yoga", completed: false },
  { name: "Cycling", completed: true },
];

const completedCount = workouts.reduce(
  (acc, w) => (w.completed ? acc + 1 : acc),
  0
);
// 2
```

### Maximum value

```js
const stepCounts = [8432, 12001, 6500, 9800];

const highest = stepCounts.reduce(
  (max, steps) => (steps > max ? steps : max),
  0
);
// 12001
```

---

## Reducing Into an Object — Grouped Data

This is where `reduce()` becomes irreplaceable. The initial value doesn't have to be a number — start with an empty object `{}` and build it up per item:

```js
const workouts = [
  { id: "w1", category: "cardio", name: "Run" },
  { id: "w2", category: "flexibility", name: "Yoga" },
  { id: "w3", category: "cardio", name: "Cycling" },
  { id: "w4", category: "strength", name: "Squats" },
];

const grouped = workouts.reduce((acc, workout) => {
  const { category } = workout;

  return {
    ...acc,
    [category]: [...(acc[category] ?? []), workout],
  };
}, {});

/*
{
  cardio: [{ id: "w1", ... }, { id: "w3", ... }],
  flexibility: [{ id: "w2", ... }],
  strength: [{ id: "w4", ... }],
}
*/
```

Breaking down the callback:
- `[category]` — computed property key (the category string becomes the object key)
- `...acc` — keeps all existing groups
- `acc[category] ?? []` — if this group doesn't exist yet, start with `[]`
- `[...existingGroup, workout]` — append the current workout to that group's array

The result is a lookup object keyed by category — perfect for rendering a sectioned list.

---

## What This Looks Like in React Native

### 1. Dashboard stats — multiple aggregations in one pass

```js
const computeStats = (workouts) =>
  workouts.reduce(
    (acc, workout) => ({
      totalCalories: acc.totalCalories + workout.calories,
      totalMinutes: acc.totalMinutes + workout.duration,
      count: acc.count + 1,
      highestCalories: Math.max(acc.highestCalories, workout.calories),
    }),
    { totalCalories: 0, totalMinutes: 0, count: 0, highestCalories: 0 }
  );

const stats = computeStats(workouts);
// { totalCalories: 880, totalMinutes: 65, count: 3, highestCalories: 410 }
```

One pass through the array computes four different stats simultaneously — more efficient than calling `filter()`/`map()` four separate times.

### 2. Grouped workouts for a `SectionList`

React Native's `SectionList` renders grouped data — like your contacts grouped by first letter, or workouts grouped by day. Its `sections` prop expects exactly the shape `reduce()` naturally produces:

```js
const workoutsByDay = rawWorkouts.reduce((acc, workout) => {
  const day = workout.date; // e.g. "2026-06-29"

  return {
    ...acc,
    [day]: [...(acc[day] ?? []), workout],
  };
}, {});

// Convert the grouped object into the array format SectionList expects
const sections = Object.entries(workoutsByDay).map(([date, data]) => ({
  title: date,
  data,
}));

// Then:
<SectionList
  sections={sections}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <WorkoutRow workout={item} />}
  renderSectionHeader={({ section }) => <Text>{section.title}</Text>}
/>
```

The pattern: `reduce()` into a grouped object, then `Object.entries().map()` to convert to the section array shape. Chapter 17 covers `Object.entries()` in full — for now, see it as the bridge between the grouped object and the array format `SectionList` actually needs.

### 3. Weekly calorie summary

```js
const weeklySummary = dailyLogs.reduce((acc, log) => {
  const week = getWeekNumber(log.date);
  const existing = acc[week] ?? { calories: 0, days: 0 };

  return {
    ...acc,
    [week]: {
      calories: existing.calories + log.calories,
      days: existing.days + 1,
    },
  };
}, {});
```

Each entry builds up a per-week running total — the kind of aggregation behind any "this week vs last week" comparison widget in a health app.

---

## When to Reach for `reduce()` (and When Not To)

`reduce()` is powerful but not always necessary. Reach for it when:

- You're aggregating into a single number (sum, max, count)
- You're collapsing an array into an object (grouping, indexing by key)
- You need multiple aggregations in a single pass

Don't reach for it when simpler methods do the job:

```js
// ❌ Unnecessary reduce — map() is clearer
const names = users.reduce((acc, user) => [...acc, user.name], []);

// ✅ Just use map()
const names = users.map(user => user.name);

// ❌ Unnecessary reduce — filter() is clearer
const active = users.reduce((acc, user) => {
  if (user.active) acc.push(user);
  return acc;
}, []);

// ✅ Just use filter()
const active = users.filter(user => user.active);
```

If `map()` or `filter()` can express the same transformation clearly, use them. Overusing `reduce()` produces code that's clever-but-unreadable — the callback is doing two jobs (accumulation *and* transformation) when one would do.

---

## Common Mistakes

**Mistake 1: Skipping the initial value on non-trivial accumulations**

```js
// ❌ Crashes on empty array, wrong behaviour on single-element array for objects
const grouped = workouts.reduce((acc, w) => ({ ...acc, [w.category]: w }));

// ✅ Always initialize
const grouped = workouts.reduce((acc, w) => ({ ...acc, [w.category]: w }), {});
```

**Mistake 2: Mutating the accumulator directly**

```js
// ❌ Mutates the accumulator object in place — causes subtle bugs
const grouped = workouts.reduce((acc, w) => {
  acc[w.category] = acc[w.category] ?? [];
  acc[w.category].push(w);
  return acc;
}, {});

// ✅ Return a new object each time
const grouped = workouts.reduce((acc, w) => ({
  ...acc,
  [w.category]: [...(acc[w.category] ?? []), w],
}), {});
```

The mutating version often "works" in simple cases, but violates the immutability principle from Chapter 5 and can cause unexpected behaviour in React state updates if the accumulated object ends up in state.

**Mistake 3: Using `reduce()` to build an array when `map()`/`filter()` would do**

```js
// ❌ Reinventing map() with reduce()
const doubled = numbers.reduce((acc, n) => [...acc, n * 2], []);

// ✅ That's literally what map() is for
const doubled = numbers.map(n => n * 2);
```

---

## Quick Recap

| Pattern | Initial Value | Produces |
|---------|---------------|---------|
| Sum / total | `0` | Number |
| Count with condition | `0` | Number |
| Max / min | `0` or `-Infinity` | Number |
| Grouped by key | `{}` | Object of arrays |
| Multi-stat aggregation | `{ stat1: 0, stat2: 0 }` | Object |

---

## Up Next

**Chapter 16 — Immutable State Updates: Why You Can't Mutate in React**

You've used spread and `map()`/`filter()` to avoid mutation throughout this module. Chapter 16 ties it all together — why React's rendering model fundamentally requires immutability, what actually breaks when you mutate state directly, and the complete toolkit for every update shape you'll encounter.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
