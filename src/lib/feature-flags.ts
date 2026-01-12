// Feature flags for gradual rollout of new features
export const FEATURES = {
  /**
   * Master Editor: Unified TipTap editor with fixed section headers
   * Enables Notion-like block reordering across sections
   * Set VITE_ENABLE_MASTER_EDITOR=true in .env to activate
   */
  MASTER_EDITOR: import.meta.env.VITE_ENABLE_MASTER_EDITOR === 'true'
};
