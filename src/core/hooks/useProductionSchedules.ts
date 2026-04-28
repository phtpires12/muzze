import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface ProductionSchedule {
    id: string;
    script_id: string;
    user_id: string;
    stage: string;
    scheduled_date: string;
    completed: boolean;
    completed_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export const useProductionSchedules = (scriptId?: string) => {
    const { profile } = useProfile();
    const queryClient = useQueryClient();
    const userId = profile?.user_id;

    const { data: schedules, isLoading } = useQuery({
        queryKey: ['production_schedules', userId, scriptId],
        queryFn: async () => {
            if (!userId) return [];

            let query = supabase
                .from('production_schedules')
                .select('*')
                .eq('user_id', userId);

            if (scriptId) {
                query = query.eq('script_id', scriptId);
            }

            const { data, error } = await query.order('scheduled_date', { ascending: true });

            if (error) throw error;
            return data as ProductionSchedule[];
        },
        enabled: !!userId,
    });

    const upsertSchedulesMutation = useMutation({
        mutationFn: async (newSchedules: Omit<ProductionSchedule, 'id' | 'created_at' | 'updated_at' | 'completed_at'>[]) => {
            if (!userId) throw new Error('User not found');

            const schedulesToInsert = newSchedules.map(s => ({
                ...s,
                updated_at: new Date().toISOString()
            }));

            const { data, error } = await supabase
                .from('production_schedules')
                .upsert(schedulesToInsert)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['production_schedules', userId] });
        },
    });

    const toggleCompletedMutation = useMutation({
        mutationFn: async ({ scheduleId, completed }: { scheduleId: string, completed: boolean }) => {
            if (!userId) throw new Error('User not found');

            const { data, error } = await supabase
                .from('production_schedules')
                .update({
                    completed,
                    completed_at: completed ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', scheduleId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['production_schedules', userId] });
        },
    });

    return {
        schedules,
        isLoading,
        upsertSchedules: upsertSchedulesMutation.mutateAsync,
        isUpserting: upsertSchedulesMutation.isPending,
        toggleCompleted: toggleCompletedMutation.mutateAsync,
        isToggling: toggleCompletedMutation.isPending,
    };
};
