import { createContext, useContext, useState, ReactNode } from "react";

export interface SessionContextType {
  stage: "" | "ideation" | "script" | "record" | "edit";
  duration: number | null;
  contentId: string | null;
}

interface SessionContextProviderProps {
  children: ReactNode;
}

interface SessionContextValue {
  sessionContext: SessionContextType;
  setSessionContext: (context: SessionContextType) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
  const [sessionContext, setSessionContext] = useState<SessionContextType>({
    stage: "",
    duration: null,
    contentId: null,
  });

  return (
    <SessionContext.Provider value={{ sessionContext, setSessionContext }}>
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
