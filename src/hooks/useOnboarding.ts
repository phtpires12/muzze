import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  OnboardingData,
  OnboardingState,
  SCREENS_PER_PHASE,
} from "@/types/onboarding";

const STORAGE_KEY = "muzze_onboarding_state";
const ONBOARDING_VERSION = "1.0";

export const useOnboarding = () => {
  const { toast } = useToast();
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const screensPerPhase = SCREENS_PER_PHASE;
    const totalPhases = screensPerPhase.length;

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<OnboardingState> & {
          data?: OnboardingData;
        };

        // Ensure phase is within valid bounds
        let phase = typeof parsed.phase === "number" ? parsed.phase : 0;
        if (phase < 0 || phase >= totalPhases) {
          phase = 0;
        }

        // Ensure screen is within valid bounds for the current phase
        let screen = typeof parsed.screen === "number" ? parsed.screen : 0;
        if (screen < 0) screen = 0;
        if (screen >= screensPerPhase[phase]) {
          screen = screensPerPhase[phase] - 1;
        }

        return {
          phase,
          screen,
          data: parsed.data || {},
          loading: false,
          totalPhases,
          screensPerPhase,
        };
      } catch (e) {
        console.error("Failed to parse onboarding state:", e);
      }
    }

    return {
      phase: 0,
      screen: 0,
      data: {},
      loading: false,
      totalPhases,
      screensPerPhase,
    };
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Save to Supabase database
  const saveToDatabase = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_data: {
            ...state.data,
            current_phase: state.phase,
            current_screen: state.screen,
            version: ONBOARDING_VERSION,
          } as any,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar seu progresso.",
        variant: "destructive",
      });
    }
  }, [state, toast]);

  // Update data field
  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        ...updates,
      },
    }));
  }, []);

  // Navigate to next screen
  const nextScreen = useCallback(() => {
    setState((prev) => {
      const currentPhaseScreens = prev.screensPerPhase[prev.phase];
      
      // If at last screen of current phase, move to next phase
      if (prev.screen >= currentPhaseScreens - 1) {
        if (prev.phase < prev.totalPhases - 1) {
          return {
            ...prev,
            phase: prev.phase + 1,
            screen: 0,
          };
        }
        return prev; // Already at the end
      }

      // Move to next screen in current phase
      return {
        ...prev,
        screen: prev.screen + 1,
      };
    });
  }, []);

  // Navigate to previous screen
  const prevScreen = useCallback(() => {
    setState((prev) => {
      // If at first screen of current phase, move to previous phase
      if (prev.screen === 0) {
        if (prev.phase > 0) {
          const prevPhase = prev.phase - 1;
          const prevPhaseScreens = prev.screensPerPhase[prevPhase];
          return {
            ...prev,
            phase: prevPhase,
            screen: prevPhaseScreens - 1,
          };
        }
        return prev; // Already at the beginning
      }

      // Move to previous screen in current phase
      return {
        ...prev,
        screen: prev.screen - 1,
      };
    });
  }, []);

  // Jump to specific phase/screen
  const goToScreen = useCallback((phase: number, screen: number) => {
    setState((prev) => ({
      ...prev,
      phase,
      screen,
    }));
  }, []);

  // Calculate lost posts
  const calculateLostPosts = useCallback((monthsTrying: number, currentPosts: number): number => {
    const daysElapsed = monthsTrying * 30;
    const expectedPosts = Math.floor(daysElapsed / 2); // 1 post every 2 days
    const lostPosts = Math.max(0, expectedPosts - currentPosts);
    return lostPosts;
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
    }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const completedData: OnboardingData = {
        ...state.data,
        completed_at: new Date().toISOString(),
        version: ONBOARDING_VERSION,
      };

      // Save to profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_data: completedData as any,
          daily_goal_minutes: state.data.daily_goal_minutes || 25,
          reminder_time: state.data.creation_time || "09:00:00",
          preferred_platform: state.data.preferred_platform,
          username: state.data.username,
          first_login: false,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);

      toast({
        title: state.data.username 
          ? `Bem-vindo à Muzze, ${state.data.username}!` 
          : "Bem-vindo à Muzze!",
        description: "Vamos começar sua jornada criativa.",
      });

      setState((prev) => ({
        ...prev,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast({
        title: "Erro ao finalizar",
        description: "Não foi possível completar o cadastro.",
        variant: "destructive",
      });

      setState((prev) => ({
        ...prev,
        loading: false,
      }));

      return false;
    }
  }, [state.data, toast]);

  // Calculate progress percentage
  const getProgress = useCallback(() => {
    const totalScreens = state.screensPerPhase.reduce((sum, count) => sum + count, 0);
    const completedScreens = state.screensPerPhase
      .slice(0, state.phase)
      .reduce((sum, count) => sum + count, 0) + state.screen;
    
    return Math.round((completedScreens / totalScreens) * 100);
  }, [state.phase, state.screen, state.screensPerPhase]);

  return {
    state,
    updateData,
    nextScreen,
    prevScreen,
    goToScreen,
    saveToDatabase,
    completeOnboarding,
    calculateLostPosts,
    getProgress,
  };
};
