# Chapter 7 — Module 1 Mini Challenge: Refactor a Legacy Component

> **Module 1 · Lesson 7 of 7** | 🏋️ Exercise | ⏱ 15 min

---

## What You'll Do

Six chapters in, you've learned: `let`/`const` and block scoping, arrow functions and implicit returns, template literals, destructuring, spread/rest, and short-circuit + optional chaining.

This chapter has no new theory. You're given one legacy, `var`-based React Native component and asked to refactor it using everything from Module 1. This is the same kind of file you'll actually inherit on a real codebase — old, defensive, repetitive, and due for a cleanup.

---

## The Brief

You've just joined a team maintaining a fitness app. You've been handed `WorkoutSummaryCard.js` — written years ago, never modernised. Your tech lead asks you to refactor it before adding any new features, so the team can read and extend it safely.

**Do not change behaviour.** The component must render exactly the same output. This is a pure refactor.

---

## Starting Code

```jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

function WorkoutSummaryCard(props) {
  var name = props.user && props.user.name ? props.user.name : "Athlete";
  var caloriesBurned = props.stats && props.stats.calories ? props.stats.calories : 0;
  var durationMins = props.stats && props.stats.duration ? props.stats.duration : 0;
  var exerciseList = props.exercises ? props.exercises : [];

  var goal = props.goal ? props.goal : 500;
  var percent = Math.round((caloriesBurned / goal) * 100);

  var exerciseText = "";
  for (var i = 0; i < exerciseList.length; i++) {
    if (i === exerciseList.length - 1) {
      exerciseText = exerciseText + exerciseList[i];
    } else {
      exerciseText = exerciseText + exerciseList[i] + ", ";
    }
  }

  function handlePress() {
    if (props.onCardPress) {
      props.onCardPress(props.user && props.user.id ? props.user.id : null);
    }
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={{ padding: 16, borderRadius: 8, backgroundColor: "#fff" }}>
        <Text>{"Hey " + name + "!"}</Text>
        <Text>{"Calories burned: " + caloriesBurned + " / " + goal}</Text>
        <Text>{percent + "% of goal reached"}</Text>
        <Text>{"Duration: " + durationMins + " mins"}</Text>
        {exerciseList.length > 0 ? (
          <Text>{"Exercises: " + exerciseText}</Text>
        ) : null}
        {caloriesBurned >= goal ? (
          <Text>Goal reached! 🎉</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default WorkoutSummaryCard;
```

---

## Your Task

Refactor `WorkoutSummaryCard.js` to apply every concept from Module 1:

1. Replace every `var` with `let` or `const` — whichever is correct for that variable
2. Convert the function component to an arrow function
3. Use object destructuring for `props` — including nested destructuring with defaults where it makes sense
4. Replace all string concatenation with template literals
5. Replace the `exerciseText` `for` loop with `Array.prototype.join()` — no loop needed
6. Replace `? :` null-rendering patterns with short-circuit `&&` where appropriate (watch out for the `0`-renders-as-text trap from Chapter 6)
7. Use optional chaining (`?.`) and nullish coalescing (`??`) instead of manual `&&` chains for defaults
8. Use `?.()` for the optional `onCardPress` callback instead of an `if` check

Try it yourself before expanding the solution. Open your editor, paste the starting code, and refactor line by line — that's how this actually sticks.

---

<details>
<summary>✅ Solution</summary>

```jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const WorkoutSummaryCard = ({ user, stats, exercises = [], goal = 500, onCardPress }) => {
  const name = user?.name ?? "Athlete";
  const caloriesBurned = stats?.calories ?? 0;
  const durationMins = stats?.duration ?? 0;

  const percent = Math.round((caloriesBurned / goal) * 100);
  const exerciseText = exercises.join(", ");

  const handlePress = () => {
    onCardPress?.(user?.id ?? null);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={{ padding: 16, borderRadius: 8, backgroundColor: "#fff" }}>
        <Text>{`Hey ${name}!`}</Text>
        <Text>{`Calories burned: ${caloriesBurned} / ${goal}`}</Text>
        <Text>{`${percent}% of goal reached`}</Text>
        <Text>{`Duration: ${durationMins} mins`}</Text>
        {exercises.length > 0 && <Text>{`Exercises: ${exerciseText}`}</Text>}
        {caloriesBurned >= goal && <Text>Goal reached! 🎉</Text>}
      </View>
    </TouchableOpacity>
  );
};

export default WorkoutSummaryCard;
```

### Why each change was made

| Original | Refactored | Reason |
|----------|------------|--------|
| `var name = props.user && props.user.name ? props.user.name : "Athlete"` | `const name = user?.name ?? "Athlete"` | Optional chaining replaces the manual `&&` guard; `??` is correct here since `name` would never legitimately be an empty falsy value you want to keep as-is, but `??` is still the safer default over `\|\|` |
| `props.stats && props.stats.calories ? ... : 0` | `stats?.calories ?? 0` | This is the critical one — `props.stats.calories \|\| 0` would be a bug if calories is genuinely `0` (the user's very first reading). `??` avoids that trap entirely |
| `function WorkoutSummaryCard(props) {}` | `const WorkoutSummaryCard = ({ ... }) => {}` | Arrow function + props destructured directly in the signature |
| `props.exercises ? props.exercises : []` | `exercises = []` (default param) | Default values belong in the destructure, not the function body |
| `for` loop building `exerciseText` | `exercises.join(", ")` | The loop was manually reimplementing what `.join()` already does — always reach for built-in array methods before hand-rolling a loop |
| `"Hey " + name + "!"` | `` `Hey ${name}!` `` | Every concatenation became a template literal |
| `exerciseList.length > 0 ? (<Text>...</Text>) : null` | `exercises.length > 0 && <Text>...</Text>` | Ternary-to-`null` is exactly what `&&` is for — shorter, same result |
| `caloriesBurned >= goal ? (<Text>...</Text>) : null` | `caloriesBurned >= goal && <Text>...</Text>` | Same pattern — note this is safe from the `0`-bug because the left side is a boolean expression (`>=`), not a raw number |
| `if (props.onCardPress) { props.onCardPress(...) }` | `onCardPress?.(user?.id ?? null)` | Optional chaining on a function call — no `if` needed |

### A note on the `&&` choices

Both `&&` usages here are safe from the Chapter 6 trap because the left-hand side is always a **boolean expression** (`exercises.length > 0`, `caloriesBurned >= goal`) — never a raw number that could be `0`. If you'd written `{exercises.length && <Text>...}`, an empty array (`length` is `0`) would render a stray `0` on screen. Comparisons first, always.

</details>

---

## Self-Check

Before moving to Module 2, you should be able to look at any line of the refactored code and explain *why* it's written that way — not just that it "looks cleaner." If any row in the table above doesn't make sense, that's a signal to revisit that chapter before continuing.

---

## Module 1 Complete 🎉

You've covered the seven ES6+ fundamentals that show up in every React Native file you'll ever open:

1. `let`, `const` & block scoping
2. Arrow functions & implicit returns
3. Template literals
4. Object & array destructuring
5. Spread & rest operators
6. Short-circuit evaluation & optional chaining
7. This refactor challenge

You now have the vocabulary to read RN source code fluently — your own, your team's, and the open-source libraries you'll depend on.

---

## Up Next

**Module 2 — Functions, Closures & Asynchronous JavaScript**

This is where things get genuinely React-specific: closures and why they explain half the bugs you'll hit with hooks, `async`/`await` for API calls, and `useCallback`/`useMemo` — the two hooks that depend entirely on everything you just learned in Module 1.

---

*Built with ❤️ by [TechCraft By Subrata](https://rnm.subraatakumar.com)*
