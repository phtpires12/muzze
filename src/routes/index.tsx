import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { Layout, ProtectedRoute, RootLayout } from '@/components/routing/RouterComponents';

// Auth
import AuthPage from '@/pages/auth/AuthPage';
import NewOnboardingPage from '@/pages/auth/NewOnboardingPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AcceptInvitePage from '@/pages/auth/AcceptInvitePage';
import NotionCallbackPage from '@/pages/auth/NotionCallbackPage';

// Core
import IndexPage from '@/pages/core/IndexPage';
import NotFoundPage from '@/pages/core/NotFoundPage';
import InstallPage from '@/pages/core/InstallPage';
import DevToolsPage from '@/pages/core/DevToolsPage';
import TermsOfUsePage from '@/pages/core/TermsOfUsePage';
import PrivacyPolicyPage from '@/pages/core/PrivacyPolicyPage';

// Calendário
import CalendarioEditorialPage from '@/pages/calendario/CalendarioEditorialPage';
import WorkflowsPage from '@/pages/calendario/WorkflowsPage';

// Content
import ContentViewPage from '@/pages/content/ContentViewPage';
import EditingWorkspacePage from '@/pages/content/EditingWorkspacePage';
import SessionPage from '@/pages/content/SessionPage';
import ShotListReviewPage from '@/pages/content/ShotListReviewPage';
import ShotListRecordPage from '@/pages/content/ShotListRecordPage';

// Stats
import StatsPage from '@/pages/stats/StatsPage';
import LevelsPage from '@/pages/stats/LevelsPage';
import OfensivaPage from '@/pages/stats/OfensivaPage';
import RecapPage from '@/pages/stats/RecapPage';

// Paywall
import MyPlanPage from '@/pages/paywall/MyPlanPage';
import PaywallPage from '@/pages/paywall/PaywallPage';

// Settings
import ProfilePage from '@/pages/settings/ProfilePage';
import EditProfilePage from '@/pages/settings/EditProfilePage';
import SettingsPage from '@/pages/settings/SettingsPage';
import GuestsPage from '@/pages/settings/GuestsPage';
import HelpPage from '@/pages/settings/HelpPage';
import SendSuggestionsPage from '@/pages/settings/SendSuggestionsPage';

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            // Public routes
            { path: ROUTES.AUTH, element: <AuthPage /> },
            { path: ROUTES.AUTH_NOTION_CALLBACK, element: <NotionCallbackPage /> },
            { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
            { path: ROUTES.ONBOARDING, element: <NewOnboardingPage /> },
            { path: ROUTES.INSTALL, element: <InstallPage /> },
            { path: ROUTES.TERMS, element: <TermsOfUsePage /> },
            { path: ROUTES.PRIVACY, element: <PrivacyPolicyPage /> },
            { path: ROUTES.INVITE, element: <AcceptInvitePage /> },

            // Core (protected + layout)
            { path: ROUTES.HOME, element: <ProtectedRoute><Layout><IndexPage /></Layout></ProtectedRoute> },
            { path: ROUTES.DEV_TOOLS, element: <ProtectedRoute><Layout><DevToolsPage /></Layout></ProtectedRoute> },

            // Calendário
            { path: ROUTES.CALENDARIO, element: <ProtectedRoute><Layout><CalendarioEditorialPage /></Layout></ProtectedRoute> },
            { path: ROUTES.WORKFLOWS, element: <ProtectedRoute><Layout><WorkflowsPage /></Layout></ProtectedRoute> },

            // Content
            { path: ROUTES.SESSION, element: <ProtectedRoute><SessionPage /></ProtectedRoute> },
            { path: ROUTES.SHOT_LIST_REVIEW, element: <ProtectedRoute><ShotListReviewPage /></ProtectedRoute> },
            { path: ROUTES.SHOT_LIST_RECORD, element: <ProtectedRoute><ShotListRecordPage /></ProtectedRoute> },
            { path: ROUTES.CONTENT_VIEW, element: <ProtectedRoute><ContentViewPage /></ProtectedRoute> },
            { path: ROUTES.EDITING_WORKSPACE, element: <ProtectedRoute><EditingWorkspacePage /></ProtectedRoute> },

            // Stats / Gamificação
            { path: ROUTES.STATS, element: <ProtectedRoute><Layout><StatsPage /></Layout></ProtectedRoute> },
            { path: ROUTES.LEVELS, element: <ProtectedRoute><LevelsPage /></ProtectedRoute> },
            { path: ROUTES.OFENSIVA, element: <ProtectedRoute><OfensivaPage /></ProtectedRoute> },
            { path: ROUTES.MY_PROGRESS, element: <Navigate to={ROUTES.MY_PLAN} replace /> },
            { path: ROUTES.RECAP, element: <ProtectedRoute><RecapPage /></ProtectedRoute> },

            // Paywall / Plano
            { path: ROUTES.MY_PLAN, element: <ProtectedRoute><Layout><MyPlanPage /></Layout></ProtectedRoute> },
            { path: ROUTES.PAYWALL, element: <ProtectedRoute><PaywallPage /></ProtectedRoute> },
            { path: ROUTES.PAYWALL_SUCCESS, element: <Navigate to={ROUTES.HOME} replace /> },

            // Settings
            { path: ROUTES.PROFILE, element: <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute> },
            { path: ROUTES.EDIT_PROFILE, element: <ProtectedRoute><Layout><EditProfilePage /></Layout></ProtectedRoute> },
            { path: ROUTES.SETTINGS, element: <ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute> },
            { path: ROUTES.GUESTS, element: <ProtectedRoute><Layout><GuestsPage /></Layout></ProtectedRoute> },
            { path: ROUTES.HELP, element: <ProtectedRoute><Layout><HelpPage /></Layout></ProtectedRoute> },
            { path: ROUTES.SEND_SUGGESTIONS, element: <ProtectedRoute><Layout><SendSuggestionsPage /></Layout></ProtectedRoute> },

            // Fallback
            { path: '*', element: <NotFoundPage /> },
        ],
    },
]);
