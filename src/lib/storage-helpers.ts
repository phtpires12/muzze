import { supabase } from '@/integrations/supabase/client';

// Regex para extrair path de diferentes formatos de URL
const SIGNED_URL_REGEX = /\/object\/sign\/shot-references\/([^?]+)/;
const PUBLIC_URL_REGEX = /\/object\/public\/shot-references\/(.+)$/;

/**
 * Extrai o path do Storage a partir de uma URL (signed ou public)
 * Retorna o path puro se já não for uma URL
 */
export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Já é um path puro (não começa com http)
  if (!url.startsWith('http')) {
    return url;
  }
  
  // Tentar extrair de signed URL
  const signedMatch = url.match(SIGNED_URL_REGEX);
  if (signedMatch) {
    return decodeURIComponent(signedMatch[1]);
  }
  
  // Tentar extrair de public URL
  const publicMatch = url.match(PUBLIC_URL_REGEX);
  if (publicMatch) {
    return decodeURIComponent(publicMatch[1]);
  }
  
  return null;
}

/**
 * Gera uma signed URL a partir de um path no Storage
 * @param path - O path do arquivo no bucket shot-references
 * @param expiresIn - Tempo de expiração em segundos (padrão: 24 horas)
 */
export async function generateSignedUrl(
  path: string, 
  expiresIn: number = 86400 // 24 horas
): Promise<string | null> {
  if (!path) return null;
  
  try {
    const { data, error } = await supabase.storage
      .from('shot-references')
      .createSignedUrl(path, expiresIn);
    
    if (error || !data) {
      console.error('Error generating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (err) {
    console.error('Exception generating signed URL:', err);
    return null;
  }
}

/**
 * Gera signed URLs em lote para múltiplos paths (otimizado)
 * @param paths - Array de paths no Storage
 * @param expiresIn - Tempo de expiração em segundos
 */
export async function generateSignedUrlsBatch(
  paths: string[],
  expiresIn: number = 86400
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  if (paths.length === 0) return results;
  
  // Usar Promise.all para paralelizar
  const promises = paths.map(async (path) => {
    const url = await generateSignedUrl(path, expiresIn);
    if (url) {
      results.set(path, url);
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Tipo para cache de URLs resolvidas
 */
export type ResolvedUrlsCache = Map<string, string>;
