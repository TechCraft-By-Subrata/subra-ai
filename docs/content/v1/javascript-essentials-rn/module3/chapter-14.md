# Chapter 14 — `filter()` & `find()`: Search, Tabs, and Conditional Lists

> **Module 3 · Lesson 2 of 6** | 📘 Concept · 🏋️ Exercise | ⏱ 8 min

---

## What You'll Learn

- `filter()` — keeping only the items that match a condition
- `find()` — getting a single matching item, not a list of them
- The critical difference between the two, and when each is correct
- How they power search bars, tab switching, and lookups in RN

---

## `filter()` — Keep What Matches

`filter()` takes an array and a test function, and returns a **new array** containing only the elements for which the test returns `true`. Unlike `map()`, the result isn't necessarily the same length — it can be shorter, or even empty.

```js
const workouts = [
  { id: "w1", name: "Run", completed: true },
  { id: "w2", name: "Yoga", completed: false },
  { id: "w3", name: "Cycling", completed: true },
];

const completed = workouts.filter(w => w.completed);
// [{ id: "w1", ... }, { id: "w3", ... }] — only 2 of the 3 items

console.log(workouts.length);   // 3 — unchanged, filter never mutates
console.log(completed.length);  // 2 — new, shorter array
```

Same immutability guarantee as `map()` — the original array is never touched.

---

## `find()` — Get One Match, Not a List

`find()` also takes a test function, but returns the **first matching element itself** — not an array. If nothing matches, it returns `undefined`.

```js
const workouts = [
  { id: "w1", name: "Run", completed: true },
  { id: "w2", name: "Yoga", completed: false },
];

const yoga = workouts.find(w => w.id === "w2");
console.log(yoga); // { id: "w2", name: "Yoga", completed: false } — the object, not an array

const missing = workouts.find(w => w.id === "w99");
console.log(missing); // undefined
```

This is the core difference to internalize:

| | Returns | Use when |
|---|---------|----------|
| `filter()` | A new array (possibly empty) | You want every matching item |
| `find()` | A single item, or `undefined` | You want exactly one specific item |

---

## What This Looks Like in React Native

### 1. Search bar filtering a list

```jsx
const [query, setQuery] = useState("");

const filteredWorkouts = workouts.filter(workout =>
  workout.name.toLowerCase().includes(query.toLowerCase())
);

return (
  <View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search workouts" />
    <FlatList
      data={filteredWorkouts}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <Text>{item.name}</Text>}
    />
  </View>
);
```

`filteredWorkouts` recalculates on every render as `query` changes, narrowing what `FlatList` displays. No mutation of the original `workouts` array — the source of truth stays intact, and the filtered view is derived from it.

### 2. Tab switching — filtering by category

```jsx
const TABS = ["all", "completed", "pending"];
const [activeTab, setActiveTab] = useState("all");

const visibleWorkouts = workouts.filter(workout => {
  if (activeTab === "all") return true;
  if (activeTab === "completed") return workout.completed;
  if (activeTab === "pending") return !workout.completed;
});
```

Each tab is just a different `filter()` condition applied to the same underlying array. This is the standard pattern behind almost every tabbed list view in RN.

### 3. Looking up a single item by ID

```js
const getWorkoutById = (workoutId) => {
  return workouts.find(w => w.id === workoutId);
};

const workout = getWorkoutById("w2");
if (workout) {
  console.log(workout.name);
}
```

Used constantly for navigation — tapping a list row passes an `id`, and the detail screen looks up the full object with `find()`.

```jsx
const WorkoutDetailScreen = ({ route }) => {
  const { workoutId } = route.params;
  const workout = workouts.find(w => w.id === workoutId);

  // workout could be undefined if the id doesn't match anything — always guard
  if (!workout) {
    return <Text>Workout not found</Text>;
  }

  return <Text>{workout.name}</Text>;
};
```

### 4. Removing an item — `filter()`, not `find()`

This is the pattern you actually used back in Chapter 5, now with the right vocabulary attached:

```js
const removeWorkout = (idToRemove) => {
  setWorkouts(prev => prev.filter(w => w.id !== idToRemove));
};
```

`filter()` keeps everything *except* the one matching the condition — the cleanest way to remove a single item from state immutably. No loop, no manual array surgery, no mutation.

### 5. Checking existence without needing the item itself

```js
const hasCompletedWorkout = workouts.some(w => w.completed);
// true/false — `some()` is filter()'s boolean cousin, stops at the first match

const allCompleted = workouts.every(w => w.completed);
// true only if every single item matches
```

Worth knowing alongside `find()`: if you only need a yes/no answer (not the matching item itself), `some()` is more direct than `find(...) !== undefined`, and `every()` covers the opposite case — confirming *all* items match.

---

## Common Mistakes

**Mistake 1: Using `filter()` when you only need one item**

```js
// ❌ Works, but wasteful — filter() scans the entire array and builds a new one
const workout = workouts.filter(w => w.id === workoutId)[0];

// ✅ find() stops at the first match — more direct and more honest about intent
const workout = workouts.find(w => w.id === workoutId);
```

**Mistake 2: Forgetting `find()` can return `undefined`**

```js
// ❌ Crashes if no workout matches
const workout = workouts.find(w => w.id === workoutId);
console.log(workout.name); // TypeError if workout is undefined

// ✅ Guard first, or use optional chaining from Chapter 6
const workout = workouts.find(w => w.id === workoutId);
console.log(workout?.name ?? "Not found");
```

**Mistake 3: Mutating inside the filter/find callback**

```js
// ❌ filter()'s job is to select, not to change — don't sneak mutations in
const completed = workouts.filter(w => {
  w.checked = true; // mutates the original objects!
  return w.completed;
});

// ✅ Keep the callback a pure check — no side effects
const completed = workouts.filter(w => w.completed);
```

---

## 🏋️ Exercise

Given this state, write the correct method call for each task:

```js
const tasks = [
  { id: "t1", title: "Buy groceries", done: false },
  { id: "t2", title: "Write report", done: true },
  { id: "t3", title: "Call dentist", done: false },
];
```

**Task 1:** Get all tasks that are not done.
**Task 2:** Get the task with id `"t2"`.
**Task 3:** Check whether *any* task is done (boolean only).
**Task 4:** Remove the task with id `"t1"` from the array (return a new array).

<details>
<summary>Solution</summary>

```js
// Task 1 — filter(): multiple matches expected
const pending = tasks.filter(t => !t.done);

// Task 2 — find(): exactly one specific item by id
const report = tasks.find(t => t.id === "t2");

// Task 3 — some(): boolean answer, don't need the item itself
const hasCompleted = tasks.some(t => t.done);

// Task 4 — filter(): removing one item means keeping everything else
const remaining = tasks.filter(t => t.id !== "t1");
```

</details>

---

## Quick Recap

| Method | Returns | Use For |
|--------|---------|---------|
| `filter()` | New array (0 to N items) | Search results, tab filtering, removing an item |
| `find()` | First matching item, or `undefined` | Looking up one specific item by ID |
| `some()` | Boolean | "Does at least one item match?" |
| `every()` | Boolean | "Do all items match?" |

---

## Up Next

**Chapter 15 — `reduce()`: Aggregating Totals and Grouped Data**

`map()` transforms, `filter()` selects — `reduce()` collapses an entire array into a single value: a total, a count, or a grouped object. It's the most powerful and most misunderstood array method, and Chapter 15 breaks it down with real RN aggregation examples — daily totals, weekly summaries, grouped lists.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
