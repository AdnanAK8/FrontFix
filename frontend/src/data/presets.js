// Text that gets sent when a suggestion card is clicked
export const PRESET_SAMPLES = {
  typeerror_map:
    "TypeError: Cannot read properties of undefined (reading 'map')\n  at ProductList (ProductList.jsx:14)",
  cors_policy_blocked:
    "Access to fetch at 'https://api.example.com/v1/users' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.",
  div_not_centered: 'My div is not centered vertically and horizontally inside its parent container.',
  infinite_rerender:
    'Error: Too many re-renders. React limits the number of renders to prevent an infinite loop at dispatchSetState.',
};

// Cards shown on the hero screen
export const SUGGESTIONS = [
  {
    key: 'typeerror_map',
    tag: 'REACT ERROR',
    title: "Cannot read properties of undefined (reading 'map')",
    iconClass: 'icon-flame',
    icon: 'flame',
  },
  {
    key: 'cors_policy_blocked',
    tag: 'API & CORS',
    title: "CORS policy blocked: No 'Access-Control-Allow-Origin' header present",
    iconClass: 'icon-globe',
    icon: 'globe',
  },
  {
    key: 'div_not_centered',
    tag: 'CSS LAYOUT',
    title: 'My div is not centered vertically and horizontally',
    iconClass: 'icon-layout',
    icon: 'layout',
  },
  {
    key: 'infinite_rerender',
    tag: 'REACT HOOKS',
    title: 'useEffect runs in an infinite re-render loop',
    iconClass: 'icon-code',
    icon: 'code',
  },
];
