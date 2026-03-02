import { renameSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const basePath = join(process.cwd(), 'src', 'pages');

const filesToMove = [
    // auth
    { src: 'Auth.tsx', dest: 'auth/AuthPage.tsx' },
    { src: 'NewOnboarding.tsx', dest: 'auth/NewOnboardingPage.tsx' },
    { src: 'ResetPassword.tsx', dest: 'auth/ResetPasswordPage.tsx' },
    { src: 'AcceptInvite.tsx', dest: 'auth/AcceptInvitePage.tsx' },

    // paywall
    { src: 'PaywallPage.tsx', dest: 'paywall/PaywallPage.tsx' },
    { src: 'PaywallSuccess.tsx', dest: 'paywall/PaywallSuccessPage.tsx' },
    { src: 'MyPlan.tsx', dest: 'paywall/MyPlanPage.tsx' },

    // calendario
    { src: 'CalendarioEditorial.tsx', dest: 'calendario/CalendarioEditorialPage.tsx' },
    { src: 'Workflows.tsx', dest: 'calendario/WorkflowsPage.tsx' },

    // content
    { src: 'ContentView.tsx', dest: 'content/ContentViewPage.tsx' },
    { src: 'EditingWorkspace.tsx', dest: 'content/EditingWorkspacePage.tsx' },
    { src: 'Session.tsx', dest: 'content/SessionPage.tsx' },
    { src: 'ShotList.tsx', dest: 'content/ShotListPage.tsx' },
    { src: 'ShotListRecord.tsx', dest: 'content/ShotListRecordPage.tsx' },
    { src: 'ShotListReview.tsx', dest: 'content/ShotListReviewPage.tsx' },
    { src: 'ShotLists.tsx', dest: 'content/ShotListsPage.tsx' },
    { src: 'Scripts.tsx', dest: 'content/ScriptsPage.tsx' },

    // stats
    { src: 'Stats.tsx', dest: 'stats/StatsPage.tsx' },
    { src: 'MyProgress.tsx', dest: 'stats/MyProgressPage.tsx' },
    { src: 'Ofensiva.tsx', dest: 'stats/OfensivaPage.tsx' },
    { src: 'Levels.tsx', dest: 'stats/LevelsPage.tsx' },
    { src: 'Recap.tsx', dest: 'stats/RecapPage.tsx' },

    // settings
    { src: 'Profile.tsx', dest: 'settings/ProfilePage.tsx' },
    { src: 'EditProfile.tsx', dest: 'settings/EditProfilePage.tsx' },
    { src: 'Settings.tsx', dest: 'settings/SettingsPage.tsx' },
    { src: 'Guests.tsx', dest: 'settings/GuestsPage.tsx' },
    { src: 'Help.tsx', dest: 'settings/HelpPage.tsx' },
    { src: 'SendSuggestions.tsx', dest: 'settings/SendSuggestionsPage.tsx' },

    // core
    { src: 'Index.tsx', dest: 'core/IndexPage.tsx' },
    { src: 'NotFound.tsx', dest: 'core/NotFoundPage.tsx' },
    { src: 'PrivacyPolicy.tsx', dest: 'core/PrivacyPolicyPage.tsx' },
    { src: 'TermsOfUse.tsx', dest: 'core/TermsOfUsePage.tsx' },
    { src: 'Install.tsx', dest: 'core/InstallPage.tsx' },
    { src: 'DevTools.tsx', dest: 'core/DevToolsPage.tsx' },
];

const dirs = new Set(filesToMove.map(f => f.dest.split('/')[0]));
for (const dir of dirs) {
    const dirPath = join(basePath, dir);
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}

for (const { src, dest } of filesToMove) {
    const srcPath = join(basePath, src);
    const destPath = join(basePath, dest);
    if (existsSync(srcPath)) {
        renameSync(srcPath, destPath);
        console.log(`Moved: ${src} -> ${dest}`);
    } else {
        console.log(`File not found: ${src}`);
    }
}
