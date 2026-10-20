import { useState } from 'react';

export default function useSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle() {
    if (window.matchMedia('(max-width: 800px)').matches) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return { collapsed, mobileOpen, toggle, closeMobile };
}
