import { createContext, useContext, useState, ReactNode } from "react";

export interface SessionContextType {
  stage: "" | "ideation" | "script" | "record" | "edit";
  duration: number | null;
  contentId: string | null;
}

export interface SessionStore {
  sessionContext: SessionContextType;
  setSessionContext: (context: Partial<SessionContextType>) => void;
  resetSessionContext: () => void;
}

interface SessionContextProviderProps {
  children: ReactNode;
}

interface SessionContextValue {
  sessionContext: SessionContextType;
  setSessionContext: (context: Partial<SessionContextType>) => void;
  resetSessionContext: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const initialContext: SessionContextType = {
  stage: "",
  duration: null,
  contentId: null,
};

export const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
  const [sessionContext, setSessionContext] = useState<SessionContextType>(initialContext);

  const updateSessionContext = (context: Partial<SessionContextType>) => {
    setSessionContext((prev) => ({ ...prev, ...context }));
  };

  const resetSessionContext = () => {
    setSessionContext(initialContext);
  };

  return (
    <SessionContext.Provider 
      value={{ 
        sessionContext, 
        setSessionContext: updateSessionContext,
        resetSessionContext,
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
