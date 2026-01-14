import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { calculateLevelByXP } from "@/lib/gamification";

interface ProfileContextValue {
  profile: any;
  loading: boolean;
  updateProfile: (updates: Partial<any>) => Promise<void>;
  addXP: (amount: number) => Promise<number>;
  refetch: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const migrateXPFromLocalStorage = async (userId: string, currentDBXP: number) => {
  try {
    const migrated = localStorage.getItem('xp_migrated');
    if (migrated === 'true') return;

    const storedStats = localStorage.getItem('userStats');
    if (!storedStats) {
      localStorage.setItem('xp_migrated', 'true');
      return;
    }

    const stats = JSON.parse(storedStats);
    const localXP = stats.totalXP || 0;

    if (localXP > (currentDBXP || 0)) {
      await supabase
        .from('profiles')
        .update({ xp_points: localXP })
        .eq('user_id', userId);

      console.log(`✅ Migrated ${localXP} XP from localStorage to database`);
    }

    localStorage.setItem('xp_migrated', 'true');
  } catch (error) {
    console.error('Error migrating XP:', error);
  }
};

export const ProfileContextProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      
      await migrateXPFromLocalStorage(user.id, data.xp_points);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    
    // Single global realtime listener
    const channel = supabase
      .channel('global-profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setProfile((prev: any) => {
            if (prev && payload.new.user_id === prev.user_id) {
              return payload.new;
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, ...updates }));
      
      toast({
        title: "Perfil atualizado",
        description: "Suas preferências foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const addXP = useCallback(async (amount: number): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return profile?.xp_points || 0;

      const newXP = (profile?.xp_points || 0) + amount;
      const newCalculatedLevel = calculateLevelByXP(newXP);
      const currentHighestLevel = profile?.highest_level || 1;

      const updates: any = { xp_points: newXP };
      if (newCalculatedLevel > currentHighestLevel) {
        updates.highest_level = newCalculatedLevel;
        console.log(`🎯 Subiu de nível! highest_level: ${currentHighestLevel} → ${newCalculatedLevel}`);
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, ...updates }));
      
      return newXP;
    } catch (error: any) {
      console.error('Error adding XP:', error);
      return profile?.xp_points || 0;
    }
  }, [profile?.xp_points, profile?.highest_level]);

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, addXP, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileContextProvider');
  }
  return context;
};
