import React, { createContext, useContext, useState } from 'react';
const Context = createContext(null);
let nextId = 0;
export function Tabs({ defaultValue, children, className = '' }) {
  const [value, setValue] = useState(defaultValue);
  const [id] = useState(() => 'tabs-' + nextId++);
  return <Context.Provider value={{value, setValue, id}}><div className={className}>{children}</div></Context.Provider>;
}
export function TabsList({ children, variant, ...props }) {
  function onKeyDown(event) {
    const buttons = Array.from(event.currentTarget.querySelectorAll('[role="tab"]'));
    const index = buttons.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next !== undefined) { event.preventDefault(); buttons[next].focus(); buttons[next].click(); }
  }
  return <div role="tablist" onKeyDown={onKeyDown} {...props}>{children}</div>;
}
export function TabsTrigger({ value, children }) {
  const tabs = useContext(Context);
  const active = tabs.value === value;
  return <button type="button" role="tab" id={tabs.id + '-tab-' + value} aria-controls={tabs.id + '-panel-' + value} aria-selected={active} tabIndex={active ? 0 : -1} data-state={active ? 'active' : 'inactive'} onClick={() => tabs.setValue(value)}>{children}</button>;
}
export function TabsContent({ value, children, ...props }) {
  const tabs = useContext(Context);
  return <div role="tabpanel" id={tabs.id + '-panel-' + value} aria-labelledby={tabs.id + '-tab-' + value} hidden={tabs.value !== value} tabIndex={0} {...props}>{children}</div>;
}
