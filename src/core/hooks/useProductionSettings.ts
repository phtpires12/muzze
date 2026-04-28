import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { Json } from '@/integrations/supabase/types';

export interface StageSlaConfig {
    ideation: number;
    script: number;
    review: number;
    recording: number;
    editing: number;
    design: number;
}

export interface ProductionSettings {
    user_id: string;
    is_enabled: boolean;
    work_days: number[];
    stage_slas: StageSlaConfig;
    updated_at: string | null;
}

const defaultSlas: StageSlaConfig = {
    ideation: 1,
    script: 1,
    review: 1,
    recording: 1,
    editing: 1,
    design: 1,
};

export const useProductionSettings = () => {
    const { profile } = useProfile();
    const queryClient = useQueryClient();
    const userId = profile?.user_id;

    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['production_settings', userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('production_settings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                return {
                    ...data,
                    stage_slas: (data.stage_slas as unknown as StageSlaConfig) || defaultSlas,
                    work_days: data.work_days || [1, 2, 3, 4, 5],
                } as ProductionSettings;
            }

            return null;
        },
        enabled: !!userId,
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: Partial<ProductionSettings>) => {
            if (!userId) throw new Error('User not found');

            const { data, error } = await supabase
                .from('production_settings')
                .upsert({
                    user_id: userId,
                    ...newSettings,
                    stage_slas: newSettings.stage_slas as unknown as Json,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['production_settings', userId] });
        },
    });

    return {
        settings,
        isLoading,
        error,
        updateSettings: updateSettingsMutation.mutateAsync,
        isUpdating: updateSettingsMutation.isPending,
    };
};
