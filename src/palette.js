export function initPalette({ go, toggleTheme, copyEmail, toggleMotion, lenis }) {
  const el = document.querySelector('.palette');
  const input = el.querySelector('.palette__input');
  const list = el.querySelector('.palette__list');
  const commands = [
    { label: 'Go to top', hint: 'nav', run: () => go('#top') },
    { label: 'About me', hint: 'nav', run: () => go('#about') },
    { label: 'Toolkit / skills', hint: 'nav', run: () => go('#skills') },
    { label: 'Selected work', hint: 'nav', run: () => go('#work') },
    { label: 'Prompt-injection lab', hint: 'nav', run: () => go('#lab') },
    { label: 'Journey & certifications', hint: 'nav', run: () => go('#journey') },
    { label: 'Contact', hint: 'nav', run: () => go('#contact') },
    { label: 'Toggle light / dark theme', hint: 'action', run: toggleTheme },
    { label: 'Copy email address', hint: 'action', run: copyEmail },
    { label: 'Pause / resume particles', hint: 'action', run: toggleMotion },
    { label: 'Open FieldProof (live)', hint: 'link', run: () => open('https://fieldproof-vercel.vercel.app/', '_blank', 'noopener') },
    { label: 'Open PromptShield (live)', hint: 'link', run: () => open('https://promptshield-drab.vercel.app/', '_blank', 'noopener') },
    { label: 'GitHub — SidharthMonangi', hint: 'link', run: () => open('https://github.com/SidharthMonangi', '_blank', 'noopener') },
    { label: 'LinkedIn — sidharth-monangi', hint: 'link', run: () => open('https://linkedin.com/in/sidharth-monangi', '_blank', 'noopener') },
  ];
  let items = commands, sel = 0, lastFocus = null;

  function render() {
    list.innerHTML = '';
    if (!items.length) { list.innerHTML = '<li class="empty">No matches — try “work” or “theme”.</li>'; return; }
    items.forEach((c, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === sel));
      li.innerHTML = `<span>${c.label}</span><small>${c.hint}</small>`;
      li.addEventListener('click', () => exec(i));
      li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; render(); } });
      list.appendChild(li);
    });
    list.children[sel]?.scrollIntoView({ block: 'nearest' });
  }
  function filter() {
    const q = input.value.trim().toLowerCase();
    items = q ? commands.filter((c) => (c.label + ' ' + c.hint).toLowerCase().includes(q)) : commands;
    sel = 0; render();
  }
  function openP() {
    lastFocus = document.activeElement;
    el.hidden = false; input.value = ''; filter();
    lenis?.stop();
    requestAnimationFrame(() => input.focus());
  }
  function closeP() {
    el.hidden = true; lenis?.start();
    lastFocus?.focus?.();
  }
  function exec(i) { const c = items[i]; if (!c) return; closeP(); setTimeout(c.run, 60); }

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(items.length, 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % Math.max(items.length, 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); exec(sel); }
  });
  el.querySelectorAll('[data-palette-close]').forEach((b) => b.addEventListener('click', closeP));
  document.querySelectorAll('[data-palette-open]').forEach((b) => b.addEventListener('click', openP));
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); el.hidden ? openP() : closeP(); }
    else if (e.key === 'Escape' && !el.hidden) closeP();
    else if (e.key === '/' && el.hidden && !e.target.closest('input, textarea')) { e.preventDefault(); openP(); }
  });
}
