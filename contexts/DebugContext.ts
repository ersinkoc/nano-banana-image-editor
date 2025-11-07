import { createContext } from 'react';
import type { DebugLog } from '../types';

interface DebugContextType {
  logs: DebugLog[];
  addLog: (type: DebugLog['type'], data: unknown) => void;
}

export const DebugContext = createContext<DebugContextType>({
  logs: [],
  addLog: () => {},
});
