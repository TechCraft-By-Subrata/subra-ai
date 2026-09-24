# Chapter 2 — Arrow Functions & Implicit Returns

> **Module 1 · Lesson 2 of 7** | 📘 Concept · 🎬 Demo | ⏱ 6 min

---

## What You'll Learn

- Arrow function syntax vs regular function syntax
- What implicit returns are and when to use them
- How `this` behaves differently in arrow functions
- Where you'll see arrow functions in React Native — and why

---

## Regular Functions vs Arrow Functions

Before ES6, every function was written with the `function` keyword:

```js
function add(a, b) {
  return a + b;
}
```

ES6 introduced a shorter syntax using `=>`:

```js
const add = (a, b) => {
  return a + b;
};
```

Same behaviour, less noise. But arrow functions also have a shorter form — **implicit returns**.

---

## Implicit Returns

If your function body is a single expression, you can drop the `{}` and the `return` keyword entirely:

```js
// Explicit return
const double = (n) => {
  return n * 2;
};

// Implicit return — same thing, one line
const double = (n) => n * 2;
```

When there's only one parameter, you can also drop the parentheses:

```js
const double = n => n * 2;
```

Three forms, same result. You'll see all three in React Native codebases.

---

## Returning an Object Literally

There's one gotcha with implicit returns: returning an object literal.

```js
// ❌ JS thinks the {} is a function body, not an object
const getUser = () => { name: "Subrata" };

// ✅ Wrap the object in parentheses
const getUser = () => ({ name: "Subrata" });
```

The parentheses tell JS: "this `{` is an object, not a block." You'll see this pattern in `StyleSheet` helpers and selector functions.

---

## What This Looks Like in React Native

Arrow functions show up in three places constantly.

### 1. Event handlers inline on components

```jsx
<Button
  title="Save"
  onPress={() => console.log("Saved!")}
/>
```

No function name needed — it's a one-liner passed directly as a prop.

### 2. `.map()` callbacks for rendering lists

```jsx
const steps = [1000, 2000, 3000];

// Implicit return — JSX is the single expression
const StepList = () => (
  <View>
    {steps.map(step => (
      <Text key={step}>{step} steps</Text>
    ))}
  </View>
);
```

The arrow function inside `.map()` uses an implicit return. The `()` around `<Text>` is the same parenthesis trick as the object example above — JSX isn't a block, so you wrap it.

### 3. Component definitions themselves

```jsx
// This is just a const assigned an arrow function
const HomeScreen = () => {
  return <View />;
};

// Or with implicit return when the component is simple
const Divider = () => <View style={styles.divider} />;
```

The vast majority of functional components in modern React Native are arrow functions assigned to `const`.

---

## The `this` Difference — Why It Actually Matters

This is the behaviour difference that matters most when reading existing code.

Regular functions define their own `this` based on how they're called:

```js
const timer = {
  seconds: 0,
  start: function () {
    setInterval(function () {
      this.seconds++; // ❌ `this` is undefined here (or global in non-strict mode)
      console.log(this.seconds);
    }, 1000);
  },
};
```

Arrow functions don't have their own `this`. They inherit it from the surrounding scope:

```js
const timer = {
  seconds: 0,
  start: function () {
    setInterval(() => {
      this.seconds++; // ✅ `this` refers to `timer`
      console.log(this.seconds);
    }, 1000);
  },
};
```

**In React Native with functional components and hooks, you almost never deal with `this` directly.** Hooks replaced the class-based model. But you'll encounter `this` in older codebases, third-party native modules, or class components that haven't been migrated — knowing why an arrow function fixes a `this` bug will save you hours.

---

## When to Use Which

```
Do you need `this`, `arguments`, or to use the function as a constructor?
  └── Yes → regular function (rare in modern RN)

Everything else?
  └── Arrow function (default choice)
```

In practice: **components, handlers, callbacks, hooks — always arrow functions.**

---

## Common Mistakes

**Mistake 1: Forgetting parentheses when returning JSX implicitly**

```jsx
// ❌ Returns undefined — JSX on next line is unreachable
const Card = () =>
  <View>
    <Text>Hello</Text>
  </View>

// ✅ Wrap multi-line JSX in parentheses
const Card = () => (
  <View>
    <Text>Hello</Text>
  </View>
);
```

**Mistake 2: Creating a new function reference on every render**

```jsx
// ❌ A new arrow function is created on every render
// For heavy components or FlatList, this causes unnecessary re-renders
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
/>

// ✅ Extract it — or use useCallback when performance matters
const renderItem = useCallback(({ item }) => <ItemCard item={item} />, []);

<FlatList data={items} renderItem={renderItem} />
```

You'll learn `useCallback` properly in Module 2. For now, just know the pattern exists.

---

## Quick Recap

| Feature               | Regular Function              | Arrow Function                  |
|-----------------------|-------------------------------|---------------------------------|
| Syntax                | `function name() {}`          | `const name = () => {}`         |
| Implicit return       | ❌                            | ✅ (single expression)          |
| Own `this`            | ✅ (dynamic)                  | ❌ (inherits from outer scope)  |
| Can be a constructor  | ✅                            | ❌                              |
| Used in RN components | Rarely (class components)     | Almost always                   |

---

## Up Next

**Chapter 3 — Template Literals for Dynamic Strings & JSX Text**

Hardcoded strings are fine until you need to inject a username, format a date, or build a dynamic style label. Template literals are how you do that cleanly — no more `"Hello, " + name + "!"`.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
