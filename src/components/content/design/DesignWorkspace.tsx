import React from 'react';
import { Card } from '@/components/ui/card';
import { Palette } from 'lucide-react';

interface DesignWorkspaceProps {
    scriptId?: string;
}

export const DesignWorkspace: React.FC<DesignWorkspaceProps> = ({ scriptId }) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="p-12 border-dashed border-2 bg-transparent flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-6">
                    <Palette className="w-8 h-8 text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Área de Design</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Esta é a nova etapa de Design para o formato Carrossel.
                    <br />
                    Em breve, você poderá visualizar e exportar seus cards aqui.
                    {scriptId && <span className="block mt-4 text-xs opacity-50">ID do Roteiro: {scriptId}</span>}
                </p>
            </Card>
        </div>
    );
};
