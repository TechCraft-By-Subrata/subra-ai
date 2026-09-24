# Chapter 18 — Module 3 Challenge: Build a Workout Log State Manager

> **Module 3 · Lesson 6 of 6** | 🏋️ Exercise | ⏱ 20 min

---

## What You'll Do

This is Module 3's final challenge — building from scratch, not refactoring. You'll implement a complete state management layer for a workout logging screen, using every concept from this module in a single coherent piece of logic.

No new theory. This is consolidation through practice.

---

## The Brief

You're building the state management logic for a `WorkoutLogScreen`. The screen needs to:

1. Store a list of workout log entries
2. Support adding, removing, and toggling entries as complete
3. Show a filtered view based on an active tab (`"all"`, `"done"`, `"pending"`)
4. Support searching entries by name
5. Compute live summary stats — total calories, total duration, and completion percentage
6. Display entries grouped by category for a `SectionList`

You are **not** building the UI — just the state, derived data, and handler functions that a component would consume.

---

## Starting Scaffold

```js
import { useState, useMemo } from 'react';

const INITIAL_LOGS = [
  { id: "l1", name: "Morning Run", category: "cardio", calories: 320, duration: 30, done: false },
  { id: "l2", name: "Yoga Flow", category: "flexibility", calories: 150, duration: 45, done: true },
  { id: "l3", name: "Bench Press", category: "strength", calories: 280, duration: 40, done: false },
  { id: "l4", name: "Cycling", category: "cardio", calories: 410, duration: 50, done: true },
  { id: "l5", name: "Stretching", category: "flexibility", calories: 80, duration: 20, done: false },
];

const useWorkoutLog = () => {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // TODO 1: addLog(entry) — add a new log entry immutably
  // TODO 2: removeLog(id) — remove a log entry immutably
  // TODO 3: toggleDone(id) — toggle the `done` field of one entry immutably
  // TODO 4: filteredLogs — derived from logs, activeTab, and searchQuery
  // TODO 5: stats — { totalCalories, totalDuration, completionPercent } derived from logs
  // TODO 6: groupedSections — array of { title, data } for SectionList, derived from filteredLogs

  return {
    logs,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    // addLog, removeLog, toggleDone,
    // filteredLogs, stats, groupedSections,
  };
};
```

Implement each TODO before looking at the solution. Try them in order — each one builds on or complements the previous.

---

## Hints (expand if stuck)

<details>
<summary>Hint for TODO 1 — addLog</summary>

Use the functional update form. The new entry needs a unique `id` — `Date.now().toString()` is fine for this exercise. Spread the incoming `entry` and add `done: false` as a default:

```js
const addLog = (entry) => {
  setLogs(prev => [...prev, { ...entry, id: Date.now().toString(), done: false }]);
};
```

</details>

<details>
<summary>Hint for TODO 4 — filteredLogs</summary>

This derives from three pieces of state. Chain `filter()` twice — once for the tab, once for the search. Use `useMemo` so it only recalculates when `logs`, `activeTab`, or `searchQuery` changes.

</details>

<details>
<summary>Hint for TODO 6 — groupedSections</summary>

`reduce()` into a grouped object keyed by `category`, then `Object.entries().map()` to convert to the `[{ title, data }]` shape `SectionList` expects. Derive from `filteredLogs`, not `logs`, so grouping respects the active filter.

</details>

---

## Solution

<details>
<summary>✅ Full Solution</summary>

```js
import { useState, useMemo } from 'react';

const INITIAL_LOGS = [
  { id: "l1", name: "Morning Run", category: "cardio", calories: 320, duration: 30, done: false },
  { id: "l2", name: "Yoga Flow", category: "flexibility", calories: 150, duration: 45, done: true },
  { id: "l3", name: "Bench Press", category: "strength", calories: 280, duration: 40, done: false },
  { id: "l4", name: "Cycling", category: "cardio", calories: 410, duration: 50, done: true },
  { id: "l5", name: "Stretching", category: "flexibility", calories: 80, duration: 20, done: false },
];

const useWorkoutLog = () => {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // TODO 1 — add a new log entry
  const addLog = (entry) => {
    setLogs(prev => [
      ...prev,
      { ...entry, id: Date.now().toString(), done: false },
    ]);
  };

  // TODO 2 — remove a log entry by id
  const removeLog = (id) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  // TODO 3 — toggle done for one entry
  const toggleDone = (id) => {
    setLogs(prev =>
      prev.map(log =>
        log.id === id ? { ...log, done: !log.done } : log
      )
    );
  };

  // TODO 4 — filtered list: tab + search, memoised
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        if (activeTab === "done") return log.done;
        if (activeTab === "pending") return !log.done;
        return true; // "all"
      })
      .filter(log =>
        log.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [logs, activeTab, searchQuery]);

  // TODO 5 — aggregate stats across ALL logs (not filtered — totals are global)
  const stats = useMemo(() => {
    const { totalCalories, totalDuration, doneCount } = logs.reduce(
      (acc, log) => ({
        totalCalories: acc.totalCalories + log.calories,
        totalDuration: acc.totalDuration + log.duration,
        doneCount: acc.doneCount + (log.done ? 1 : 0),
      }),
      { totalCalories: 0, totalDuration: 0, doneCount: 0 }
    );

    return {
      totalCalories,
      totalDuration,
      completionPercent: logs.length > 0
        ? Math.round((doneCount / logs.length) * 100)
        : 0,
    };
  }, [logs]);

  // TODO 6 — grouped sections for SectionList, derived from filteredLogs
  const groupedSections = useMemo(() => {
    const grouped = filteredLogs.reduce((acc, log) => ({
      ...acc,
      [log.category]: [...(acc[log.category] ?? []), log],
    }), {});

    return Object.entries(grouped).map(([category, data]) => ({
      title: category,
      data,
    }));
  }, [filteredLogs]);

  return {
    logs,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    addLog,
    removeLog,
    toggleDone,
    filteredLogs,
    stats,
    groupedSections,
  };
};
```

</details>

---

## Walkthrough: Every Decision Explained

**`addLog` — spread + functional update**
New entries spread the incoming object and override `id` and `done` — the caller shouldn't have to think about those fields. Spread order matters: `{ ...entry, id: ..., done: false }` means the hook's values win over whatever the caller passed in for those two keys.

**`removeLog` — `filter()`, not splice**
`filter()` returns a new array keeping everything that doesn't match the id. Never `splice()` — that mutates in place (Chapter 16's mutation list).

**`toggleDone` — `map()` with a spread on the matched item**
The cleanest immutable single-item update pattern: `map()` for a new array, spread for a new object, `!log.done` for the toggle. Every other item returns its original reference unchanged.

**`filteredLogs` — chained `filter()` with `useMemo`**
Two independent filters chained: tab condition first (cheapest discriminator), then string search. `useMemo` with `[logs, activeTab, searchQuery]` as deps — only recalculates when one of those three changes. Without `useMemo`, this recalculates on every render including unrelated re-renders.

**`stats` — `reduce()` with a multi-field accumulator**
One pass computes three things simultaneously — total calories, total duration, and done count. Division-by-zero guard on `completionPercent` when `logs` is empty. Note stats derive from `logs`, not `filteredLogs` — total stats are global, not filtered. This is an explicit design decision worth flagging in a real code review.

**`groupedSections` — `reduce()` into object, then `Object.entries().map()`**
The full Ch. 15 + Ch. 17 pattern in one place. Derived from `filteredLogs` so the grouped view respects the active tab and search — if you filter to "cardio only" via search, the sections reflect that.

---

## Self-Check

Before moving to Module 4, you should be able to answer each of these without looking:

1. Why does `toggleDone` use `map()` rather than `find()` + direct mutation?
2. Why do `filteredLogs`, `stats`, and `groupedSections` use `useMemo` but `addLog`, `removeLog`, and `toggleDone` don't?
3. Why does `stats` derive from `logs` while `groupedSections` derives from `filteredLogs`?
4. What breaks if you change `removeLog` to use `splice()` instead of `filter()`?
5. What breaks if `groupedSections` derives from `logs` instead of `filteredLogs`?

If any of these take more than a moment, revisit the chapter that covers that concept before continuing.

---

## Module 3 Complete 🎉

Six chapters, one complete module:

13. `map()` — transforming data into JSX and `FlatList` rows
14. `filter()` & `find()` — search, tabs, and single-item lookups
15. `reduce()` — totals, counts, and grouped data
16. Immutable state updates — the full pattern toolkit
17. `Object.keys`, `values`, `entries` — iterating and converting objects
18. This challenge — all of it working together as a real custom hook

The `useWorkoutLog` hook you just built is the kind of logic that lives inside almost every list-heavy screen in a production RN app — the data layer that the UI layer just reads from.

---

## Up Next

**Module 4 — Classes, Prototypes & Modern JS Patterns**

Next module covers the object model underneath JavaScript — prototypes, classes, and the patterns modern RN libraries are built on. Understanding this is what separates a developer who uses third-party libraries from one who can read, debug, and extend them.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
