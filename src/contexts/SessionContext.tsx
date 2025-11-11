import { createContext, useContext, useState, ReactNode } from "react";

export interface MuzzeSessionType {
  stage: "" | "ideation" | "script" | "record" | "edit";
  duration: number | null;
  contentId: string | null;
}

export interface SessionStore {
  muzzeSession: MuzzeSessionType;
  setMuzzeSession: (context: Partial<MuzzeSessionType>) => void;
  resetMuzzeSession: () => void;
}

interface SessionContextProviderProps {
  children: ReactNode;
}

interface SessionContextValue {
  muzzeSession: MuzzeSessionType;
  setMuzzeSession: (context: Partial<MuzzeSessionType>) => void;
  resetMuzzeSession: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const initialContext: MuzzeSessionType = {
  stage: "",
  duration: null,
  contentId: null,
};

export const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
  const [muzzeSession, setMuzzeSessionState] = useState<MuzzeSessionType>(initialContext);

  const setMuzzeSession = (context: Partial<MuzzeSessionType>) => {
    setMuzzeSessionState((prev) => ({ ...prev, ...context }));
  };

  const resetMuzzeSession = () => {
    setMuzzeSessionState(initialContext);
  };

  return (
    <SessionContext.Provider 
      value={{ 
        muzzeSession, 
        setMuzzeSession,
        resetMuzzeSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within SessionContextProvider");
  }
  return context;
};
