export const OFFLINE_KNOWLEDGE = [
  {
    id: 'typeerror_map',
    triggers: [
      'cannot read properties of undefined',
      "reading 'map'",
      '.map is not a function',
      "cannot read property 'map' of undefined",
    ],
    category: 'JavaScript & React',
    title: "TypeError: Cannot read properties of undefined (reading 'map')",
    problem:
      'An attempt to execute .map() was made on a variable that is undefined or null during render.',
    likely_cause:
      'The list state is populated asynchronously (e.g. from an API call) and defaults to undefined on initial mount, causing the component to crash before the fetch completes.',
    fix_steps: [
      '1. Explicitly track distinct loading, error, and data states with useState.',
      "2. Render a loading indicator only while loading is true, and handle empty result arrays (items.length === 0) with a 'No items found' message instead of getting trapped in a loading state.",
      '3. Initialize the array safely (useState([])) and verify that the API payload is actually an array (Array.isArray(data)) before updating state.',
    ],
    file_hint: 'src/components/ItemList.jsx',
    code_before:
      '// ❌ Broken: items is undefined initially, or empty array traps loading\nconst [items, setItems] = useState();\n\nreturn (\n  <ul>\n    {items.map(item => <li key={item.id}>{item.name}</li>)}\n  </ul>\n);',
    code_after:
      '// ✅ Fixed: Separate loading, error, and empty result states\nconst [items, setItems] = useState([]);\nconst [loading, setLoading] = useState(true);\nconst [error, setError] = useState(null);\n\nif (loading) return <p>Loading items...</p>;\nif (error) return <p>Error: {error}</p>;\nif (items.length === 0) return <p>No items found.</p>;\n\nreturn (\n  <ul>\n    {items.map(item => (\n      <li key={item.id}>{item.name}</li>\n    ))}\n  </ul>\n);',
    extra_tips:
      'TypeScript can catch this at compile time: define your state type explicitly with useState<Item[]>([]).',
    source: {
      title: 'MDN Web Docs — Array.prototype.map() & Optional Chaining',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map',
    },
  },
  {
    id: 'cors_policy_blocked',
    triggers: [
      'cors policy',
      'access-control-allow-origin',
      'blocked by cors',
      'cors policy blocked my request',
    ],
    category: 'API Integration & Network',
    title: "CORS Policy Blocked: No 'Access-Control-Allow-Origin' Header",
    problem:
      'The browser blocks client-side fetch/axios requests to a backend API due to Same-Origin Policy enforcement.',
    likely_cause:
      "The target API server did not return an Access-Control-Allow-Origin header matching your web app's origin (e.g. localhost:3000 vs localhost:8000).",
    fix_steps: [
      '1. For local development: configure a development proxy in vite.config.ts to route /api/* requests through same origin.',
      '2. For production: configure the backend server to include the CORS header: Access-Control-Allow-Origin: https://yourfrontend.com.',
      '3. If sending Authorization headers or cookies, ensure backend allows them in Access-Control-Allow-Headers.',
    ],
    file_hint: 'vite.config.ts (Development Proxy)',
    code_before:
      "// ❌ Broken: Direct cross-origin request rejected by browser\nfetch('http://localhost:8000/api/users');",
    code_after:
      "// ✅ Fixed: Configure dev proxy in vite.config.ts\nexport default defineConfig({\n  server: { proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } }\n});\nfetch('/api/users');",
    extra_tips:
      'CORS is purely browser-enforced. Tools like curl or Postman will succeed because they do not enforce browser origin sandboxes.',
    source: {
      title: 'MDN Web Docs — Cross-Origin Resource Sharing (CORS)',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
    },
  },
  {
    id: 'div_not_centered',
    triggers: [
      'my div is not centered',
      'div not centered',
      'center a div',
      'centering div',
      'center modal',
    ],
    category: 'CSS Layout & Styling',
    title: 'CSS Centering: Div or Modal Not Centered on Screen',
    problem:
      'An HTML element fails to center horizontally or vertically within its parent container or the viewport.',
    likely_cause:
      'The parent element lacks an explicit height (defaulting to content height 0), or flex/grid alignment properties were applied to the child instead of the parent container.',
    fix_steps: [
      '1. Use CSS Grid on the parent: display: grid; place-items: center; min-height: 100vh; (cleanest one-line solution).',
      '2. Or use Flexbox on the parent: display: flex; justify-content: center; align-items: center; min-height: 100vh;.',
      '3. Ensure the parent container has an explicit height such as min-height: 100vh or 100dvh.',
    ],
    file_hint: 'src/styles/layout.css',
    code_before:
      '/* ❌ Broken: Vertical margin auto fails in normal flow */\n.parent { width: 100%; }\n.child { margin: auto; }',
    code_after:
      '/* ✅ Fixed: CSS Grid place-items */\n.parent {\n  display: grid;\n  place-items: center;\n  min-height: 100vh; /* or 100dvh for mobile */\n}\n.child { max-width: 500px; width: 100%; }',
    extra_tips:
      'On mobile devices, use min-height: 100dvh instead of 100vh to avoid content shifting when the address bar collapses.',
    source: {
      title: 'MDN Web Docs — Centering in CSS',
      url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Howto/Center_an_item',
    },
  },
  {
    id: 'infinite_rerender',
    triggers: [
      'useeffect runs in an infinite loop',
      'too many re-renders',
      'infinite loop',
      'maximum update depth exceeded',
    ],
    category: 'React & Hooks',
    title: 'Too Many Re-renders: useEffect Runs in an Infinite Loop',
    problem:
      "Component re-renders continuously until React halts execution with 'Maximum update depth exceeded'.",
    likely_cause:
      'A state update function (setState) is executed directly in the component body or inside a useEffect whose dependency array mutates on every render.',
    fix_steps: [
      '1. Never call setState unconditionally in the component render body.',
      '2. Check useEffect dependencies: pass an empty array [] for mount-only effects.',
      '3. Use functional updates: setCount(prev => prev + 1) instead of adding count to dependencies.',
    ],
    file_hint: 'src/components/Counter.jsx',
    code_before:
      '// ❌ Broken: Updating state directly in effect with self dependency\nuseEffect(() => {\n  setCount(count + 1);\n}, [count]);',
    code_after:
      '// ✅ Fixed: Functional updater without dependency churn\nuseEffect(() => {\n  const timer = setInterval(() => {\n    setCount(prev => prev + 1);\n  }, 1000);\n  return () => clearInterval(timer);\n}, []);',
    extra_tips:
      "If you only need to calculate a value based on existing props or state, don't use state + effect at all; calculate it as derived state during render.",
    source: {
      title: 'React.dev — You Might Not Need an Effect',
      url: 'https://react.dev/learn/you-might-not-need-an-effect',
    },
  },
];
