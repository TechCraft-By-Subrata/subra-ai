# Chapter 13 — `map()`: Rendering FlatList Data

> **Module 3 · Lesson 1 of 6** | 📘 Concept · 🎬 Demo | ⏱ 8 min

---

## What You'll Learn

- What `map()` actually does, conceptually
- Why `map()` is the right tool for transforming data into JSX
- `FlatList`'s `renderItem` as `map()` in disguise
- The `key` prop — why it's required and what breaks without it

---

## What `map()` Does

`map()` takes an array, runs a function on every element, and returns a **new array** of the same length — one transformed value per original value.

```js
const steps = [1000, 2000, 3000];

const doubled = steps.map(step => step * 2);
// [2000, 4000, 6000]

console.log(steps);   // [1000, 2000, 3000] — unchanged, map never mutates
console.log(doubled); // [2000, 4000, 6000] — a brand new array
```

Three things to internalize: it returns a new array, it's the same length as the input, and the original array is untouched. This is the array-method equivalent of the immutability principle from Chapter 5 — `map()` never mutates what you give it.

---

## `map()` Returning JSX

The exact same mechanism — transform each item into something else — also works when "something else" is a piece of UI:

```jsx
const steps = [1000, 2000, 3000];

const StepList = () => (
  <View>
    {steps.map(step => (
      <Text key={step}>{`${step} steps`}</Text>
    ))}
  </View>
);
```

`map()` here transforms an array of numbers into an array of `<Text>` elements. React knows how to render an array of elements directly inside JSX — that's the entire trick. No special syntax, no React-specific API. It's the same `map()` you'd use on any array.

---

## `FlatList` — `map()` for Long Lists

For short, fixed lists, mapping directly in JSX (as above) is fine. But for long or dynamic lists — a workout log, a list of devices, a feed — React Native gives you `FlatList`, which is conceptually doing the same transformation, with a major performance difference: it only renders the items currently visible on screen, not the entire array at once.

```jsx
import { FlatList, Text, View } from 'react-native';

const workouts = [
  { id: "w1", name: "Morning Run", calories: 320 },
  { id: "w2", name: "Yoga", calories: 150 },
  { id: "w3", name: "Cycling", calories: 410 },
];

const WorkoutList = () => (
  <FlatList
    data={workouts}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View>
        <Text>{item.name}</Text>
        <Text>{`${item.calories} cal`}</Text>
      </View>
    )}
  />
);
```

`renderItem` is conceptually your `map()` callback — it's called once per item in `data`, and whatever JSX it returns becomes that item's row. The difference is `FlatList` doesn't call it for every item up front; it virtualizes, calling `renderItem` only for items near the visible viewport, and recycling rows as the user scrolls. Same transformation logic as `map()`, very different rendering strategy underneath.

---

## The `key` Prop — Not Optional

Whenever you render a list of elements from an array — whether via raw `.map()` in JSX or `FlatList`'s `keyExtractor` — React needs a stable, unique identifier per item.

```jsx
// ❌ No key — React warns, and list updates can behave unpredictably
{workouts.map(workout => (
  <Text>{workout.name}</Text>
))}

// ✅ Stable, unique key
{workouts.map(workout => (
  <Text key={workout.id}>{workout.name}</Text>
))}
```

React uses `key` to track which array item corresponds to which rendered element across re-renders — so when the array changes (an item added, removed, or reordered), React can correctly figure out what actually changed instead of re-rendering and potentially re-mounting everything from scratch.

### Why Index Is the Wrong Key (Usually)

```jsx
// ❌ Works visually, but breaks identity tracking when the list reorders or filters
{workouts.map((workout, index) => (
  <Text key={index}>{workout.name}</Text>
))}
```

If `workouts` is ever reordered, filtered, or has an item removed from the middle, the *index* of every item after that point shifts — even though the items themselves didn't change. React then misattributes state and identity to the wrong rows. This shows up as bugs like: text input values jumping to the wrong row, animations applying to the wrong item, or checkboxes appearing checked on the wrong entry after a delete.

Use a real, stable identifier — a database ID, a UUID, anything that uniquely and permanently belongs to that specific data item, never its position in the array.

```jsx
// ✅ Correct — id belongs to the data, not its position
{workouts.map(workout => (
  <Text key={workout.id}>{workout.name}</Text>
))}
```

Index as a key is acceptable only when the list is genuinely static and never reorders, filters, or has items inserted/removed — which, in practice, is rare enough that it's safer to default to a real ID.

---

## What This Looks Like in React Native

### 1. Transforming API data before rendering

`map()` is also commonly used to reshape data *before* it ever reaches JSX — not just to produce JSX directly:

```js
const apiResponse = [
  { id: "u1", first_name: "Subrata", last_name: "Kumar" },
  { id: "u2", first_name: "Anita", last_name: "Rao" },
];

// Reshape snake_case API fields into a flat displayName the UI actually wants
const users = apiResponse.map(user => ({
  id: user.id,
  displayName: `${user.first_name} ${user.last_name}`,
}));

// [{ id: "u1", displayName: "Subrata Kumar" }, { id: "u2", displayName: "Anita Rao" }]
```

This pattern — `map()` to transform raw API shape into the shape your components actually need — is extremely common at the boundary between a network call and rendering.

### 2. Chaining `map()` with other array methods

```js
const workouts = [
  { id: "w1", name: "Run", calories: 320, completed: true },
  { id: "w2", name: "Yoga", calories: 150, completed: false },
];

// Get display labels for only the completed workouts
const completedLabels = workouts
  .filter(w => w.completed)   // covered in Chapter 14
  .map(w => `${w.name} (${w.calories} cal)`);

// ["Run (320 cal)"]
```

`map()` rarely runs alone in real code — it's typically one link in a chain with `filter()`, `sort()`, or `reduce()`. Chapter 14 picks up `filter()` next.

### 3. `FlatList` with a separator and empty state

```jsx
<FlatList
  data={workouts}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <WorkoutRow workout={item} />}
  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eee" }} />}
  ListEmptyComponent={() => <Text>No workouts logged yet</Text>}
/>
```

`ListEmptyComponent` handles what `map()` alone doesn't — an explicit UI for the zero-items case. Worth remembering: `[].map(fn)` returns `[]`, which renders nothing, not an error. If your design needs an empty state message, you have to provide it explicitly.

---

## Common Mistakes

**Mistake 1: Using index as key on a list that can reorder or filter**

```jsx
// ❌ Breaks identity tracking on reorder/delete
data.map((item, index) => <Row key={index} {...item} />)

// ✅ Use the item's real, stable id
data.map(item => <Row key={item.id} {...item} />)
```

**Mistake 2: Mutating inside `map()`'s callback**

```js
// ❌ Mutates the original objects — violates the immutability principle from Chapter 5
const updated = users.map(user => {
  user.lastSeen = Date.now(); // mutates the original user object!
  return user;
});

// ✅ Return a new object per item
const updated = users.map(user => ({
  ...user,
  lastSeen: Date.now(),
}));
```

**Mistake 3: Using `map()` when you don't actually need the returned array**

```js
// ❌ map() implies "I want a new array" — using it just to run side effects is misleading
workouts.map(workout => console.log(workout.name));

// ✅ forEach() communicates intent correctly when you don't need a return value
workouts.forEach(workout => console.log(workout.name));
```

Not a bug, but a clarity issue — when you see `.map()` in code, you should be able to assume the return value is used somewhere. If it isn't, `forEach()` is the honest choice.

---

## Quick Recap

| Concept | Behavior |
|---------|----------|
| `map()` | Transforms each array item, returns a new array of the same length |
| `map()` + JSX | Transforms data items into rendered elements — React renders arrays of elements directly |
| `FlatList` `renderItem` | Conceptually `map()`'s callback, but virtualized for performance on long lists |
| `key` / `keyExtractor` | Must be a stable, unique identifier tied to the data — never the array index on dynamic lists |
| `map()` vs `forEach()` | Use `map()` when you need the returned array; `forEach()` when you're just running side effects |

---

## Up Next

**Chapter 14 — `filter()` & `find()`: Search, Tabs, and Conditional Lists**

You just saw `filter()` used briefly to narrow a list before mapping it. Next chapter covers `filter()` and `find()` properly — the two methods behind every search bar, tab switcher, and "find this one specific item" lookup in a React Native app.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
