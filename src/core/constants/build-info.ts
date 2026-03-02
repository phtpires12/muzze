// Build information injected at build time
export const BUILD_INFO = {
  timestamp: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString(),
  mode: import.meta.env.MODE || 'development',
};

// Helper to get a short build ID for display
export function getShortBuildId(): string {
  const timestamp = BUILD_INFO.timestamp;
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp.slice(0, 16);
  }
}
