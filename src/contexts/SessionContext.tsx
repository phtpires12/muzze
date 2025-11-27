import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface MuzzeSessionType {
  stage: "" | "ideation" | "script" | "record" | "edit" | "review";
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

// Carregar estado inicial do localStorage
const loadInitialState = (): MuzzeSessionType => {
  try {
    const saved = localStorage.getItem('muzze_session_context');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading session context from localStorage:', error);
  }
  return initialContext;
};

export const SessionContextProvider = ({ children }: SessionContextProviderProps) => {
  const [muzzeSession, setMuzzeSessionState] = useState<MuzzeSessionType>(loadInitialState);

  // Persistir em localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('muzze_session_context', JSON.stringify(muzzeSession));
  }, [muzzeSession]);

  // Sync contentId to global window object for useSession hook
  useEffect(() => {
    (window as any).__muzzeSessionContentId = muzzeSession.contentId;
  }, [muzzeSession.contentId]);

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
