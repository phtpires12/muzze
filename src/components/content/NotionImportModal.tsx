import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Database, Download, Search } from "lucide-react";
import { useToast } from "@/core/hooks";
import { useProfileContext } from '@/core/contexts';

interface NotionDatabase {
    id: string;
    title: string;
}

interface NotionImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

// Helpers copiados da antiga Edge Function para formatação de dados
const extractStringProperty = (property: any): string | null => {
    if (!property) return null;
    switch (property.type) {
        case 'title':
        case 'rich_text':
            return property[property.type].map((t: any) => t.plain_text).join('') || null;
        case 'select':
            return property.select?.name || null;
        case 'url':
            return property.url || null;
        default:
            return null;
    }
}

const extractDateProperty = (property: any): string | null => {
    if (!property || property.type !== 'date' || !property.date) return null;
    return property.date.start;
}

const mapContentType = (notionType: string | null): string => {
    if (!notionType) return 'Reels';
    const typeLower = notionType.toLowerCase();

    if (typeLower.includes('reel') || typeLower.includes('short')) return 'Reels';
    if (typeLower.includes('tiktok') || typeLower.includes('tt')) return 'TikTok';
    if (typeLower.includes('youtube') || typeLower.includes('yt')) return 'YouTube';
    if (typeLower.includes('carrossel') || typeLower.includes('carousel')) return 'Carrossel';

    return 'Reels';
}

export function NotionImportModal({ isOpen, onClose, onImportComplete }: NotionImportModalProps) {
    const [databases, setDatabases] = useState<NotionDatabase[]>([]);
    const [selectedDb, setSelectedDb] = useState<string>('');
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { toast } = useToast();
    const { profile } = useProfileContext();
    const notionToken = profile?.notion_access_token;

    useEffect(() => {
        if (isOpen) {
            if (notionToken) {
                fetchDatabases();
            } else {
                toast({
                    title: "Não autenticado",
                    description: "Você precisa conectar sua conta do Notion primeiro.",
                    variant: "destructive"
                });
                onClose();
            }
        }
    }, [isOpen, notionToken]);

    // Função para listar os bancos de dados usando o Proxy
    const fetchDatabases = async (query?: string) => {
        setIsLoadingList(true);
        try {
            const { data, error } = await supabase.functions.invoke('notion-proxy', {
                body: { action: 'search_databases', token: notionToken, query: query || undefined }
            });

            if (error) {
                throw new Error("Erro na comunicação com o backend seguro do Notion (CORS).");
            }
            if (!data || !data.success) {
                throw new Error(data?.error || 'Erro ao buscar tabelas do Notion');
            }

            const formattedDbs = data.data.results.map((db: any) => {
                let title = "Sem Nome";
                if (db.title && db.title.length > 0) {
                    title = db.title[0].plain_text;
                }
                return {
                    id: db.id,
                    title: title,
                };
            });

            setDatabases(formattedDbs);

            if (formattedDbs.length > 0) {
                setSelectedDb(formattedDbs[0].id);
            } else {
                toast({
                    title: "Nenhuma tabela encontrada",
                    description: "Não achamos nenhuma base de dados conectada no seu Notion. Verifique as permissões de acesso.",
                    variant: "destructive"
                })
            }
        } catch (err: any) {
            console.error("Erro listando databases do Notion:", err);
            toast({
                title: "Erro de conexão",
                description: err.message || "Não foi possível conectar ao Notion para listar suas tabelas.",
                variant: "destructive"
            });
            onClose();
        } finally {
            setIsLoadingList(false);
        }
    };

    // Função para realizar a importação do banco de dados direto do navegador
    const handleImport = async () => {
        if (!selectedDb || !notionToken) return;

        setIsImporting(true);

        toast({
            title: "Importando do Notion...",
            description: "Por favor, aguarde. Isso pode levar alguns segundos dependendo do tamanho da sua tabela.",
        });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado no aplicativo");

            // 1. Query the database rows via Proxy
            const { data: queryDataObj, error: queryError } = await supabase.functions.invoke('notion-proxy', {
                body: { action: 'query_database', token: notionToken, database_id: selectedDb }
            });

            if (queryError || !queryDataObj || !queryDataObj.success) {
                throw new Error(queryDataObj?.error || `Falha ao consultar páginas do banco de dados no Notion.`);
            }

            const pages = queryDataObj.data.results;
            const scriptsToInsert = [];

            // 2. Processar cada página da tabela
            for (const page of pages) {
                const properties = page.properties;

                let title = '';
                let dateField = null;
                let typeField = null;
                let urlField = null;

                for (const key of Object.keys(properties)) {
                    const prop = properties[key];
                    if (prop.type === 'title') title = extractStringProperty(prop) || '';
                    if (prop.type === 'date' && !dateField) dateField = extractDateProperty(prop);
                    if (prop.type === 'select' && !typeField && key.toLowerCase().includes('tipo')) typeField = extractStringProperty(prop);
                    if (prop.type === 'url' && !urlField) urlField = extractStringProperty(prop);
                }

                if (!title || title.trim() === '') continue;

                let centralIdea = '';
                let contentJson: string | null = null;

                // Opcional: Buscar os blocos de texto via Proxy
                try {
                    const { data: blocksObj, error: blocksError } = await supabase.functions.invoke('notion-proxy', {
                        body: { action: 'get_blocks', token: notionToken, page_id: page.id }
                    });

                    if (!blocksError && blocksObj && blocksObj.success) {
                        const paragraphs = blocksObj.data.results
                            .filter((b: any) => b.type === 'paragraph' && b.paragraph?.rich_text)
                            .map((b: any) => b.paragraph.rich_text.map((t: any) => t.plain_text).join(''))
                            .filter((p: string) => p.trim() !== '');

                        if (paragraphs.length > 0) {
                            centralIdea = paragraphs.join('\n\n').substring(0, 500);
                            contentJson = JSON.stringify([{
                                id: crypto.randomUUID(),
                                name: 'Importado do Notion',
                                content: paragraphs.join('\n\n')
                            }]);
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch blocks for page', page.id, e);
                }

                scriptsToInsert.push({
                    user_id: user.id,
                    title: title,
                    publish_date: dateField || new Date().toISOString(),
                    content_type: mapContentType(typeField),
                    reference_url: urlField,
                    central_idea: centralIdea || null,
                    content: contentJson,
                    workflow_template: 'custom' // Custom para os workflows herdados
                });
            }

            // 3. Batch Insert into Supabase
            if (scriptsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('scripts')
                    .insert(scriptsToInsert);

                if (insertError) throw insertError;
            }

            toast({
                title: "Importação concluída! ✅",
                description: `Foram importados ${scriptsToInsert.length} conteúdos para o seu Calendário.`,
            });

            onImportComplete();
            onClose();
        } catch (err: any) {
            console.error("Erro ao importar do Notion:", err);
            toast({
                title: "Falha na importação",
                description: err.message || "Tivemos um problema ao processar seu banco de dados.",
                variant: "destructive"
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isImporting && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Importar do Notion
                    </DialogTitle>
                    <DialogDescription>
                        Selecione qual tabela / calendário do Notion você deseja importar para o Muzze.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="flex gap-2 relative">
                        <Input
                            placeholder="Buscar tabelas ou calendários por nome..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') fetchDatabases(searchQuery)
                            }}
                            className="w-full pl-9"
                        />
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                        <Button
                            variant="secondary"
                            onClick={() => fetchDatabases(searchQuery)}
                            disabled={isLoadingList}
                        >
                            Buscar
                        </Button>
                    </div>

                    {isLoadingList ? (
                        <div className="flex flex-col items-center justify-center p-4 space-y-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Buscando suas tabelas do Notion...</p>
                        </div>
                    ) : databases.length > 0 ? (
                        <div className="space-y-4">
                            <Select value={selectedDb} onValueChange={setSelectedDb} disabled={isImporting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um banco de dados..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[250px] overflow-y-auto">
                                    {databases.map((db) => (
                                        <SelectItem key={db.id} value={db.id}>
                                            {db.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">
                                Apenas bancos de dados que você compartilhou expressamente com o Muzze aparecerão aqui.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center p-4 text-sm text-muted-foreground bg-accent/20 rounded-md">
                            Nenhum banco de dados disponível.
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isImporting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={isImporting || isLoadingList || !selectedDb || databases.length === 0}
                        className="gap-2"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Importar Conteúdos
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
