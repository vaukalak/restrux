# restrux

Observable bindings to redux or redux-like react context.

# So.. why do we need that

Redux is great, however all connectors recomputes the selection on each state change (even completely unrelated to connected component).
By increasing number of connnected components, each state update becomes more expensive.
Also sometimes it may be quite tricky to write a good comparing sollution for your selector, or you may just forget to add `shallowCompare` when using selector hook.
The issue is that performance bugs are not easy ones to catch, which may make your app to perform bad on slower devices.
Restrux aims to remove this downside, by streaming parts of your state to target components.
This will make components been called lazily when there source data has changed, instead of requesing the state on each store change.

# Installation:

```
npm i -S restrux
```

# Usage

### Define selectors

```
const selectUsers = ({ users }) => users;

const selectCurrentUserId = ({ currentUserId }) => currentUserId;

const selectedUser = defineSelector(
  selectUsers,
  selectCurrentUserId,
  (users, currentUserId) => users[currentUserId],
);
```

The `selectedUser` object, is just a spec, that will be later fullfilled to a selector driver.
It's designed this way, so you can reuse it for both stream based and classic selectors (for example to use it in redux-saga).
