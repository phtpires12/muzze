import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Database, Download, Search, File, ChevronRight, ArrowLeft, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/core/hooks";
import { useProfileContext } from '@/core/contexts';

interface NotionItem {
    id: string;
    title: string;
    type: 'database' | 'page';
}

interface NavLayer {
    parentId: string;
    title: string;
    items: NotionItem[];
    isLoadingList?: boolean;
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

const getTitle = (item: any) => {
    if (item.object === 'database') {
        return item.title?.[0]?.plain_text || "Sem Nome";
    }
    if (item.object === 'page' && item.properties) {
        for (const key of Object.keys(item.properties)) {
            const p = item.properties[key];
            if (p.type === 'title') {
                return p.title?.[0]?.plain_text || "Sem Nome";
            }
        }
    }
    return "Sem Nome";
}

export function NotionImportModal({ isOpen, onClose, onImportComplete }: NotionImportModalProps) {
    const [navStack, setNavStack] = useState<NavLayer[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [activeTab, setActiveTab] = useState('link');

    const { toast } = useToast();
    const { profile } = useProfileContext();
    const notionToken = profile?.notion_access_token;

    useEffect(() => {
        if (isOpen) {
            if (notionToken) {
                fetchRoot();
            } else {
                toast({
                    title: "Não autenticado",
                    description: "Você precisa conectar sua conta do Notion primeiro.",
                    variant: "destructive"
                });
                onClose();
            }
        } else {
            // Reset state on close
            setNavStack([]);
            setSearchQuery('');
            setLinkInput('');
        }
    }, [isOpen, notionToken]);

    const fetchRoot = async (query?: string) => {
        setNavStack([{ parentId: 'root', title: 'Início', items: [], isLoadingList: true }]);
        try {
            const { data, error } = await supabase.functions.invoke('notion-proxy', {
                body: { action: 'search_all', token: notionToken, query: query || undefined }
            });

            if (error) throw new Error("Erro na comunicação com o backend seguro do Notion.");
            if (!data || !data.success) {
                // Fallback caso a edge function não suporte search_all ainda
                if (data?.error?.includes('Action method not supported')) {
                    toast({
                        title: "Proxy desatualizado",
                        description: "Por favor, atualize o código da Edge Function no Lovable Cloud para a versão Nova.",
                        variant: "destructive"
                    });
                }
                throw new Error(data?.error || 'Erro ao buscar tabelas do Notion');
            }

            const formatted = data.data.results.map((item: any) => ({
                id: item.id,
                title: getTitle(item),
                type: item.object
            }));

            setNavStack([{ parentId: 'root', title: 'Início', items: formatted, isLoadingList: false }]);
        } catch (err: any) {
            console.error("Erro listando root:", err);
            setNavStack([{ parentId: 'root', title: 'Início', items: [], isLoadingList: false }]);
        }
    };

    const handleExpandPage = async (page: NotionItem) => {
        setNavStack(prev => [...prev, { parentId: page.id, title: page.title, items: [], isLoadingList: true }]);

        try {
            const { data, error } = await supabase.functions.invoke('notion-proxy', {
                body: { action: 'get_blocks', token: notionToken, page_id: page.id }
            });

            if (error || !data?.success) throw new Error(data?.error || "Erro ao buscar subpastas.");

            const childBlocks = data.data.results.filter((b: any) => b.type === 'child_page' || b.type === 'child_database');
            const children: NotionItem[] = childBlocks.map((b: any) => ({
                id: b.id,
                title: b.type === 'child_page' ? b.child_page.title : b.child_database.title,
                type: b.type === 'child_page' ? 'page' : 'database'
            }));

            setNavStack(prev => {
                const newStack = [...prev];
                newStack[newStack.length - 1].items = children;
                newStack[newStack.length - 1].isLoadingList = false;
                return newStack;
            });
        } catch (err: any) {
            toast({ title: "Erro", description: err.message, variant: "destructive" });
            setNavStack(prev => {
                const newStack = [...prev];
                newStack[newStack.length - 1].isLoadingList = false;
                return newStack;
            });
        }
    }

    const goBack = () => {
        setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }

    const handleLinkImport = () => {
        let dbId = linkInput.trim();
        if (dbId.includes('notion.so/')) {
            // tentar extrair o id q são os últimos 32 chars do link
            const match = dbId.match(/([a-f0-9]{32})(?:\?|$)/i);
            if (match) {
                dbId = match[1];
            } else {
                toast({ title: 'Link inválido', description: 'Não conseguimos achar o ID da tabela neste link.', variant: 'destructive' });
                return;
            }
        }

        // Validate UUID or 32 char ID
        if (dbId.length === 32) {
            dbId = `${dbId.substring(0, 8)}-${dbId.substring(8, 12)}-${dbId.substring(12, 16)}-${dbId.substring(16, 20)}-${dbId.substring(20)}`;
        }

        handleImportInternal(dbId);
    }

    const handleImportInternal = async (databaseId: string) => {
        if (!databaseId || !notionToken) return;

        setIsImporting(true);

        toast({
            title: "Importando do Notion...",
            description: "Por favor, aguarde. Isso pode levar alguns segundos.",
        });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado no aplicativo");

            const { data: queryDataObj, error: queryError } = await supabase.functions.invoke('notion-proxy', {
                body: { action: 'query_database', token: notionToken, database_id: databaseId }
            });

            if (queryError || !queryDataObj || !queryDataObj.success) {
                throw new Error(queryDataObj?.error || `Falha ao acessar os dados da tabela no Notion.`);
            }

            const pages = queryDataObj.data.results;
            const scriptsToInsert = [];

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

                try {
                    const { data: blocksObj, error: blocksError } = await supabase.functions.invoke('notion-proxy', {
                        body: { action: 'get_blocks', token: notionToken, page_id: page.id }
                    });

                    if (!blocksError && blocksObj && blocksObj.success) {
                        const validBlockTypes = ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle', 'quote', 'callout'];

                        const textBlocks = blocksObj.data.results
                            .filter((b: any) => validBlockTypes.includes(b.type) && b[b.type]?.rich_text)
                            .map((b: any) => b[b.type].rich_text.map((t: any) => t.plain_text).join(''))
                            .filter((p: string) => p.trim() !== '');

                        if (textBlocks.length > 0) {
                            centralIdea = textBlocks.join('\n\n').substring(0, 500);
                            contentJson = JSON.stringify([{
                                id: crypto.randomUUID(),
                                name: 'Importado do Notion',
                                content: textBlocks.join('\n\n')
                            }]);
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch blocks for page', page.id, e);
                }

                const scriptDate = dateField || new Date().toISOString();
                const isPast = new Date(scriptDate).getTime() < new Date().setHours(0, 0, 0, 0);

                scriptsToInsert.push({
                    user_id: user.id,
                    title: title,
                    publish_date: scriptDate,
                    publish_status: isPast ? 'postado' : 'planejado',
                    content_type: mapContentType(typeField),
                    reference_url: urlField,
                    central_idea: centralIdea || null,
                    content: contentJson,
                    workflow_template: 'custom',
                    notion_page_id: page.id,
                    date_manually_set: false,
                } as any);
            }

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

    const currentLayer = navStack[navStack.length - 1];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isImporting && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Importar do Notion
                    </DialogTitle>
                    <DialogDescription>
                        Navegue pelas suas pastas ou cole um link direto para importar.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="browse">Navegar Pastas</TabsTrigger>
                        <TabsTrigger value="link">Link Direto</TabsTrigger>
                    </TabsList>

                    <TabsContent value="browse" className="py-4 space-y-4">
                        {navStack.length === 1 && (
                            <div className="flex gap-2 relative">
                                <Input
                                    placeholder="Pesquisar em todo o Notion..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') fetchRoot(searchQuery)
                                    }}
                                    className="w-full pl-9"
                                />
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                                <Button
                                    variant="secondary"
                                    onClick={() => fetchRoot(searchQuery)}
                                    disabled={currentLayer?.isLoadingList}
                                >
                                    Buscar
                                </Button>
                            </div>
                        )}

                        <div className="rounded-md border bg-muted/10 h-[300px] flex flex-col relative overflow-hidden">
                            <div className="flex items-center py-2 px-1 border-b bg-background/95 backdrop-blur z-10 w-full shrink-0">
                                {navStack.length > 1 ? (
                                    <Button variant="ghost" size="sm" onClick={goBack} className="h-8 gap-1 mr-2 px-2 ml-1">
                                        <ArrowLeft className="w-4 h-4" />
                                        Voltar
                                    </Button>
                                ) : (
                                    <div className="w-4 h-4 mx-2" />
                                )}
                                <span className="font-medium text-sm flex-1 truncate">{currentLayer?.title || "Início"}</span>
                            </div>

                            <ScrollArea className="flex-1 w-full h-full p-2">
                                {currentLayer?.isLoadingList ? (
                                    <div className="flex flex-col items-center justify-center h-[200px] space-y-4 h-full">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-sm text-muted-foreground">Carregando...</p>
                                    </div>
                                ) : currentLayer?.items?.length > 0 ? (
                                    <div className="space-y-1 pb-4">
                                        {currentLayer.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md group transition-colors">
                                                <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                                                    {item.type === 'database' ? (
                                                        <Database className="w-4 h-4 text-primary shrink-0" />
                                                    ) : (
                                                        <File className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    )}
                                                    <span className="text-sm truncate select-none">{item.title}</span>
                                                </div>

                                                {item.type === 'page' ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 px-2"
                                                        onClick={() => handleExpandPage(item)}
                                                    >
                                                        Abrir <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 ml-2"
                                                        onClick={() => handleImportInternal(item.id)}
                                                        disabled={isImporting}
                                                    >
                                                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importar"}
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                                        Nenhum item encontrado nesta pasta.
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="link" className="py-6 space-y-6">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Sabia que é mais rápido importar por link? Vá no Notion, clique em <strong>Share</strong> na tabela desejada, depois <strong>Copy Link</strong> e cole aqui!
                            </p>
                            <div className="flex gap-2 relative">
                                <LinkIcon className="w-5 h-5 text-muted-foreground absolute left-3 top-2.5" />
                                <Input
                                    className="pl-10"
                                    placeholder="https://notion.so/Seu-Calendario-12345..."
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full gap-2"
                            disabled={!linkInput || isImporting}
                            onClick={handleLinkImport}
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Importar pelo Link
                                </>
                            )}
                        </Button>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="sm:justify-between border-t pt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isImporting}
                    >
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
