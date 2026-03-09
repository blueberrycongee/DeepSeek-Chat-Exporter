## DeepSeek Chat Exporter – Break/Fix Guide

Purpose: When DeepSeek updates their frontend, DOM classes and React structure can change. Use this checklist to quickly restore exports without guesswork.

### 0) What you’ll need
- Firefox + React Developer Tools extension
- This repository open so you can edit `deepseek_chat_exporter.user.js`

### 1) Verify DOM selectors (change only if these fail)
- Chat container: `.dad65929`
- User message: `._9663006 .fbb737a4`
- Thinking container: `.e1675d8b`
- Final answer DOM: a `div.ds-markdown` NOT inside `.e1675d8b`

If these are wrong, update `chatContainerSelector`, `userMessageSelector`, `thinkingChainSelector`, or the final-answer DOM filter logic accordingly.

### 2) Capture React paths with React DevTools (authoritative)
We don’t scrape rendered HTML. We extract the raw markdown/thinking from React `memoizedProps`.

Define a helper in the Console (paste once):
```javascript
window.__scanReact = (el, prop) => {
  const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
  if (!fiberKey) return { error: 'No react fiber on element' };
  const start = el[fiberKey];
  const seen = new Set();
  const stack = [[start, '$0']];
  while (stack.length) {
    const [f, path] = stack.pop();
    if (!f || seen.has(f)) continue;
    seen.add(f);
    const mp = f.memoizedProps;
    if (mp && Object.prototype.hasOwnProperty.call(mp, prop) && mp[prop]) {
      const preview = typeof mp[prop] === 'string' ? mp[prop].slice(0, 200) : '[non-string]';
      return { path, prop, preview, full: mp[prop] };
    }
    stack.push([f.child,   path + '.child']);
    stack.push([f.sibling, path + '.sibling']);
    stack.push([f.return,  path + '.return']);
  }
  return { error: `prop ${prop} not found from this node` };
};
```

Probe the two elements (right‑click → Inspect to set `$0`):
- Final answer: select the answer `div.ds-markdown`, run:
```javascript
__scanReact($0, 'markdown')
```
- Thinking: select the thinking `div.ds-markdown` inside `.e1675d8b`, run:
```javascript
__scanReact($0, 'content')
```

Record the returned `path` strings.

### 3) Update the script config
Open `deepseek_chat_exporter.user.js` and set:
```js
answerMarkdownPath: '<path from markdown probe>',
thinkingContentPath: '<path from content probe>'
```

Example (as of 2025‑09‑08):
```js
answerMarkdownPath: '$0.return.return.return',
thinkingContentPath: '$0.child.child.child.return.return.return.return.return.return.return'
```

### 4) Test
- Export to Markdown. In the Console you should see:
  - `Found final answer at path: config.answerMarkdownPath`
  - `Found thinking content at path: config.thinkingContentPath`
- The MD file should contain:
  - `## User` with your message
  - `## Assistant` with one `### Thought Process` block and the final answer markdown

### 5) If it still fails
- Redo the probes to confirm new paths.
- If DOM selectors changed, update those first (step 1).
- As a last resort, paste the two probe objects here in an issue or chat for help.

Notes:
- We intentionally avoid HTML→Markdown conversion. The script extracts the original markdown from React so we preserve code blocks, math, etc.
- The code prefers the configured path; it only falls back to a limited scanner to print a path you can copy into config next time.
