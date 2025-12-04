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

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Limpar sessões órfãs com mais de 24 horas
const cleanupOrphanSessions = () => {
  try {
    // Limpar muzze_session_state (usado pelo useSession hook)
    const sessionState = localStorage.getItem('muzze_session_state');
    if (sessionState) {
      const parsed = JSON.parse(sessionState);
      const lastUpdate = parsed.lastUpdateTime || parsed.startTime;
      if (lastUpdate) {
        const age = Date.now() - lastUpdate;
        if (age > TWENTY_FOUR_HOURS_MS) {
          console.log('[SessionContext] Removendo sessão órfã (muzze_session_state) com mais de 24h');
          localStorage.removeItem('muzze_session_state');
        }
      }
    }

    // Limpar muzze_session_context se muito antigo (verificar via timestamp interno se existir)
    const sessionContext = localStorage.getItem('muzze_session_context');
    if (sessionContext) {
      const parsed = JSON.parse(sessionContext);
      // Se tiver um contentId mas não tiver atividade recente, limpar
      if (parsed.contentId && parsed.lastActivity) {
        const age = Date.now() - parsed.lastActivity;
        if (age > TWENTY_FOUR_HOURS_MS) {
          console.log('[SessionContext] Removendo contexto órfão (muzze_session_context) com mais de 24h');
          localStorage.removeItem('muzze_session_context');
        }
      }
    }
  } catch (error) {
    console.error('[SessionContext] Erro ao limpar sessões órfãs:', error);
  }
};

// Carregar estado inicial do localStorage
const loadInitialState = (): MuzzeSessionType => {
  // Executar limpeza de sessões órfãs antes de carregar
  cleanupOrphanSessions();
  
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
