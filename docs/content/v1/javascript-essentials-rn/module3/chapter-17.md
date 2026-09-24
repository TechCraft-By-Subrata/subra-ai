# Chapter 17 — `Object.keys`, `values`, and `entries`: Iterating API Responses

> **Module 3 · Lesson 5 of 6** | 📘 Concept · 🎬 Demo | ⏱ 8 min

---

## What You'll Learn

- What `Object.keys()`, `Object.values()`, and `Object.entries()` return
- Why you need them — objects aren't iterable like arrays
- Converting between objects and arrays in both directions
- The RN patterns they power: settings screens, dynamic forms, grouped lists

---

## The Problem: You Can't `.map()` an Object

Arrays are iterable — you can loop over them, `.map()` them, `.filter()` them directly. Objects are not:

```js
const stats = { steps: 8432, calories: 320, water: 2.4 };

stats.map(item => item); // ❌ TypeError: stats.map is not a function
```

To work with an object's contents using array methods, you first need to convert it into an array. That's exactly what `Object.keys()`, `Object.values()`, and `Object.entries()` do.

---

## The Three Methods

```js
const stats = { steps: 8432, calories: 320, water: 2.4 };

Object.keys(stats);
// ["steps", "calories", "water"] — array of key names

Object.values(stats);
// [8432, 320, 2.4] — array of values

Object.entries(stats);
// [["steps", 8432], ["calories", 320], ["water", 2.4]] — array of [key, value] pairs
```

All three return brand new arrays — the original object is untouched. The order follows insertion order for string keys (reliable in modern JS engines for the common use case of plain objects).

---

## `Object.keys()` — When You Need the Key Names

```js
const settings = {
  notifications: true,
  darkMode: false,
  syncEnabled: true,
};

const settingKeys = Object.keys(settings);
// ["notifications", "darkMode", "syncEnabled"]

// Check how many settings exist
console.log(settingKeys.length); // 3

// Check if a key exists
console.log(settingKeys.includes("darkMode")); // true

// Safer key existence check (doesn't traverse the prototype chain)
console.log("darkMode" in settings); // true — alternative worth knowing
```

---

## `Object.values()` — When You Need the Values, Not the Keys

```js
const weeklySteps = {
  Mon: 8432,
  Tue: 6100,
  Wed: 9800,
  Thu: 4200,
  Fri: 11000,
};

const stepValues = Object.values(weeklySteps);
// [8432, 6100, 9800, 4200, 11000]

const total = stepValues.reduce((acc, n) => acc + n, 0);  // 39532
const average = Math.round(total / stepValues.length);     // 7906
const best = Math.max(...stepValues);                      // 11000
```

Here `Object.values()` bridges into the array methods from the previous chapters — get the values, then aggregate with `reduce()` or spread into `Math.max()`.

---

## `Object.entries()` — When You Need Both

`Object.entries()` gives you pairs, which is what you need when both the key and value matter — rendering a settings list, building a query string, converting an API response shape.

```js
const stats = { steps: 8432, calories: 320, water: 2.4 };

Object.entries(stats).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});
// steps: 8432
// calories: 320
// water: 2.4
```

Array destructuring (`[key, value]`) in the callback — each entry is a two-element array.

---

## Converting Back: `Object.fromEntries()`

`Object.entries()` turns an object into an array of pairs. `Object.fromEntries()` goes the other direction — pairs back into an object:

```js
const stats = { steps: 8432, calories: 320, water: 2.4 };

// Transform values while preserving structure
const rounded = Object.fromEntries(
  Object.entries(stats).map(([key, value]) => [key, Math.round(value)])
);
// { steps: 8432, calories: 320, water: 2 }
```

The pattern: `Object.entries()` → `.map()` to transform each pair → `Object.fromEntries()` to reassemble. This is the object equivalent of the array transform chain from Chapter 13 — useful for normalising API responses, converting units, or applying defaults to every key at once.

---

## What This Looks Like in React Native

### 1. Rendering a settings screen dynamically

```jsx
const userSettings = {
  notifications: true,
  darkMode: false,
  locationAccess: true,
  autoSync: false,
};

const SettingsScreen = () => (
  <View>
    {Object.entries(userSettings).map(([key, value]) => (
      <View key={key} style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text>{key}</Text>
        <Switch value={value} onValueChange={(val) => updateSetting(key, val)} />
      </View>
    ))}
  </View>
);
```

Instead of hardcoding a row for each setting, `Object.entries()` generates them all from the data. Adding a new setting to `userSettings` automatically adds a row — no JSX to update.

### 2. Iterating a grouped API response

Some APIs return data grouped by a key rather than a flat array:

```js
// API response shape
const exercisesByMuscle = {
  chest: ["pushups", "bench press", "dips"],
  back: ["pull-ups", "rows", "deadlift"],
  legs: ["squats", "lunges", "calf raises"],
};

// Convert to SectionList-compatible sections (from Chapter 15)
const sections = Object.entries(exercisesByMuscle).map(([muscle, exercises]) => ({
  title: muscle,
  data: exercises,
}));

/*
[
  { title: "chest", data: ["pushups", "bench press", "dips"] },
  { title: "back", data: ["pull-ups", "rows", "deadlift"] },
  { title: "legs", data: ["squats", "lunges", "calf raises"] },
]
*/
```

This is the exact bridge pattern mentioned in Chapter 15 — `reduce()` into a grouped object, then `Object.entries().map()` to produce `SectionList`'s `sections` array.

### 3. Building query parameters from a filter object

```js
const filters = {
  category: "cardio",
  completed: true,
  limit: 20,
};

const queryString = Object.entries(filters)
  .filter(([, value]) => value !== null && value !== undefined)
  .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
  .join("&");

// "category=cardio&completed=true&limit=20"
const url = `${BASE_URL}/workouts?${queryString}`;
```

`[, value]` in the destructure — the comma skips the first element (the key) because you only need the value for the `null`/`undefined` check. This is the same "skip position" pattern from array destructuring in Chapter 4.

### 4. Normalising an API response — keying by ID

```js
// API returns an array — useful for rendering
const workoutsArray = [
  { id: "w1", name: "Run", calories: 320 },
  { id: "w2", name: "Yoga", calories: 150 },
];

// Convert to a lookup object — useful for O(1) access by id
const workoutsById = Object.fromEntries(
  workoutsArray.map(w => [w.id, w])
);
/*
{
  w1: { id: "w1", name: "Run", calories: 320 },
  w2: { id: "w2", name: "Yoga", calories: 150 },
}
*/

// Now lookup is instant — no .find() scan needed
const workout = workoutsById["w1"];
```

Large lists where you frequently look up by ID often benefit from this normalisation — convert once on fetch, then read by key instead of scanning with `find()` every time.

---

## Common Mistakes

**Mistake 1: Forgetting that object key order isn't always guaranteed for non-string keys**

```js
const obj = { 2: "two", 1: "one", 3: "three" };

Object.keys(obj); // ["1", "2", "3"] — numeric keys sort ascending, regardless of insertion order
```

Integer-like keys are sorted numerically. String keys follow insertion order. If order matters, use an array instead of an object, or sort explicitly after calling `Object.keys()`/`Object.entries()`.

**Mistake 2: Checking key existence with `Object.keys().includes()` instead of `in`**

```js
const settings = { darkMode: false };

// ❌ Unnecessary — creates an array just to check one key
Object.keys(settings).includes("darkMode"); // true, but verbose

// ✅ Direct and correct
"darkMode" in settings; // true
settings.darkMode !== undefined; // also works, but misses explicitly-set undefined values
```

**Mistake 3: Mutating the object while iterating with `Object.entries()`**

```js
const stats = { steps: 0, calories: 0 };

// ❌ Modifying the source object while iterating it — unpredictable
Object.entries(stats).forEach(([key]) => {
  stats[key] = 100; // mutates the source
});

// ✅ Build a new object instead
const updated = Object.fromEntries(
  Object.entries(stats).map(([key]) => [key, 100])
);
```

---

## Quick Recap

| Method | Returns | Use When |
|--------|---------|----------|
| `Object.keys(obj)` | Array of key names | You need to iterate or check keys |
| `Object.values(obj)` | Array of values | You need the values only — for reduce, math, etc. |
| `Object.entries(obj)` | Array of `[key, value]` pairs | You need both — rendering, building query strings |
| `Object.fromEntries(pairs)` | Object from pairs | Reassembling after transforming entries |

---

## Up Next

**Chapter 18 — Module 3 Challenge: Build a Workout Log State Manager**

The final chapter of Module 3. You'll build a full state management function set for a workout logging screen — using `map()`, `filter()`, `reduce()`, `Object.entries()`, and immutable update patterns all together. Same format as Chapter 7's refactor, but this time you're building from scratch, not cleaning up legacy code.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
