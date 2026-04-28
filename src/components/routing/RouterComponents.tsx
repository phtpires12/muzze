import { ReactNode, useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppLayout, AppNavigationProvider } from '@/components/layout/AppNavigation';
import { WorkspaceContextProvider } from '@/core/contexts';
import { PlanContextProvider } from '@/core/contexts';
import { GlobalCelebrations } from "@/components/shared";
import { LevelUpModal } from "@/components/shared";
import { TrophyUnlockedModal } from "@/components/shared";
import { TutorialProvider } from "@/components/content/tutorial/TutorialProvider";
import { TutorialOverlay } from "@/components/content/tutorial/TutorialOverlay";
import { UpgradeCelebration } from "@/components/content/upgrade/UpgradeCelebration";
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/routes/routes';

// Layout wrapper (adds AppLayout shell)
export const Layout = ({ children }: { children: ReactNode }) => (
    <AppLayout>{children}</AppLayout>
);

// Protected route guard
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [clientRole, setClientRole] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();
                setProfile(profileData);

                // Check if user is a client in any workspace they belong to
                const { data: memberRows } = await supabase
                    .from('workspace_members')
                    .select('role')
                    .eq('user_id', user.id)
                    .not('accepted_at', 'is', null);
                const isClient =
                    !!memberRows && memberRows.length > 0 &&
                    memberRows.every((m: any) => m.role === 'client');
                setClientRole(isClient);
            }
            setLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);

            if (session?.user) {
                setTimeout(() => {
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .maybeSingle()
                        .then(({ data: profileData }) => setProfile(profileData));
                    supabase
                        .from('workspace_members')
                        .select('role')
                        .eq('user_id', session.user.id)
                        .not('accepted_at', 'is', null)
                        .then(({ data: memberRows }) => {
                            const isClient =
                                !!memberRows && memberRows.length > 0 &&
                                memberRows.every((m: any) => m.role === 'client');
                            setClientRole(isClient);
                        });
                }, 0);
            } else {
                setProfile(null);
                setClientRole(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="safe-app min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-xl text-foreground">Carregando...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={ROUTES.ONBOARDING} replace />;
    }

    const currentPath = window.location.pathname;
    if (profile?.first_login === true && currentPath !== ROUTES.ONBOARDING) {
        return <Navigate to={ROUTES.ONBOARDING} replace />;
    }

    // Modo cliente: usuários cujo único papel em todos workspaces é "client"
    // são redirecionados para a interface simplificada do cliente.
    if (clientRole && !currentPath.startsWith('/cliente')) {
        return <Navigate to={ROUTES.CLIENT_HOME} replace />;
    }
    if (!clientRole && currentPath.startsWith('/cliente')) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return <>{children}</>;
};

// Root layout with all providers
export const RootLayout = () => (
    <AppNavigationProvider>
        <WorkspaceContextProvider>
            <PlanContextProvider>
                <TutorialProvider>
                    <GlobalCelebrations />
                    <LevelUpModal />
                    <TrophyUnlockedModal />
                    <TutorialOverlay />
                    <UpgradeCelebration />
                    <div className="safe-app">
                        <Outlet />
                    </div>
                </TutorialProvider>
            </PlanContextProvider>
        </WorkspaceContextProvider>
    </AppNavigationProvider>
);
