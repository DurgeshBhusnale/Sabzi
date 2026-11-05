import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** Lets any vendor screen open the "I've arrived" sheet (V-08). */
type VendorShell = { arriveOpen: boolean; openArrive: () => void; closeArrive: () => void };

const Ctx = createContext<VendorShell>({ arriveOpen: false, openArrive: () => undefined, closeArrive: () => undefined });

export function VendorShellProvider({ children }: { children: ReactNode }) {
  const [arriveOpen, setOpen] = useState(false);
  const value = useMemo(() => ({ arriveOpen, openArrive: () => setOpen(true), closeArrive: () => setOpen(false) }), [arriveOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVendorShell(): VendorShell {
  return useContext(Ctx);
}
