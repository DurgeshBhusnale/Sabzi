import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** The society the buyer is looking at (defaults to the primary one). */
type Ctx = { societyId: string | null; setSocietyId: (id: string) => void };
const C = createContext<Ctx>({ societyId: null, setSocietyId: () => undefined });

export function BuyerProvider({ initial, children }: { initial: string | null; children: ReactNode }) {
  const [picked, setPicked] = useState<string | null>(null);
  const value = useMemo(() => ({ societyId: picked ?? initial, setSocietyId: setPicked }), [picked, initial]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useBuyer = () => useContext(C);
