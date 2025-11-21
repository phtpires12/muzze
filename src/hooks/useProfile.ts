import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    
    // Setup realtime listener for profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Migrate localStorage XP to database if needed (one-time migration)
      await migrateXPFromLocalStorage(user.id, data.xp_points);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateXPFromLocalStorage = async (userId: string, currentDBXP: number) => {
    try {
      // Check if migration already done
      const migrated = localStorage.getItem('xp_migrated');
      if (migrated === 'true') return;

      // Get XP from localStorage
      const storedStats = localStorage.getItem('userStats');
      if (!storedStats) {
        localStorage.setItem('xp_migrated', 'true');
        return;
      }

      const stats = JSON.parse(storedStats);
      const localXP = stats.totalXP || 0;

      // Only migrate if localStorage has more XP than database
      if (localXP > (currentDBXP || 0)) {
        await supabase
          .from('profiles')
          .update({ xp_points: localXP })
          .eq('user_id', userId);

        console.log(`✅ Migrated ${localXP} XP from localStorage to database`);
      }

      // Mark as migrated
      localStorage.setItem('xp_migrated', 'true');
    } catch (error) {
      console.error('Error migrating XP:', error);
    }
  };

  const updateProfile = async (updates: Partial<any>) => {
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
  };

  const addXP = async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newXP = (profile?.xp_points || 0) + amount;

      const { error } = await supabase
        .from('profiles')
        .update({ xp_points: newXP })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, xp_points: newXP }));
      
      return newXP;
    } catch (error: any) {
      console.error('Error adding XP:', error);
      return profile?.xp_points || 0;
    }
  };

  return { profile, loading, updateProfile, addXP, refetch: fetchProfile };
};
