/**
 * Constantes de path de todas as rotas da aplicação.
 * Use estas constantes nos links e no roteador para garantir consistência.
 */
export const ROUTES = {
    // Public / Auth
    AUTH: '/auth',
    RESET_PASSWORD: '/reset-password',
    ONBOARDING: '/onboarding',
    INSTALL: '/install',
    TERMS: '/terms',
    PRIVACY: '/privacy',
    INVITE: '/invite',

    // Core
    HOME: '/',

    // Calendário / Editorial
    CALENDARIO: '/calendario',
    WORKFLOWS: '/workflows',

    // Content
    SESSION: '/session',
    SHOT_LIST_REVIEW: '/shot-list/review',
    SHOT_LIST_RECORD: '/shot-list/record',
    CONTENT_VIEW: '/content/view/:scriptId',
    EDITING_WORKSPACE: '/editing-workspace',

    // Stats / Gamificação
    STATS: '/stats',
    LEVELS: '/levels',
    OFENSIVA: '/ofensiva',
    MY_PROGRESS: '/my-progress',
    RECAP: '/recap/:recapId',

    // Paywall / Plano
    MY_PLAN: '/my-plan',
    PAYWALL: '/paywall',
    PAYWALL_SUCCESS: '/paywall/success',

    // Settings / Perfil
    PROFILE: '/profile',
    EDIT_PROFILE: '/edit-profile',
    SETTINGS: '/settings',
    GUESTS: '/guests',
    HELP: '/help',
    SEND_SUGGESTIONS: '/send-suggestions',

    // Dev
    DEV_TOOLS: '/dev-tools',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
