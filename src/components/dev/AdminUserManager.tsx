import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, RefreshCw, Search, Check } from 'lucide-react';

interface UserRow {
  user_id: string;
  email: string | null;
  username: string | null;
  plan_type: string | null;
  created_at: string | null;
}

const PLAN_BADGE_VARIANT: Record<string, 'secondary' | 'warning' | 'default'> = {
  free: 'secondary',
  pro: 'warning',
  studio: 'default',
};

export const AdminUserManager = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [settingPlan, setSettingPlan] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_list_users');
      if (rpcError) throw rpcError;
      setUsers((data as UserRow[]) || []);
    } catch (err: any) {
      console.error('[AdminUserManager] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.email?.toLowerCase().includes(q)) ||
      (u.username?.toLowerCase().includes(q))
    );
  }, [users, search]);

  const handleSetPlan = async (userId: string, newPlan: 'free' | 'pro' | 'studio') => {
    setSettingPlan(userId);
    try {
      const { error } = await supabase.rpc('admin_set_plan_type', {
        target_user: userId,
        new_plan: newPlan,
      });
      if (error) throw error;
      toast.success(`Plano alterado para ${newPlan.toUpperCase()}`);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, plan_type: newPlan } : u));
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setSettingPlan(null);
    }
  };

  return (
    <Card className="mb-4 border-blue-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Gerenciar Usuários
        </CardTitle>
        <CardDescription>
          {users.length} usuários cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search + Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="max-h-[500px] overflow-auto rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email / Username</TableHead>
                  <TableHead className="w-[100px]">Plano</TableHead>
                  <TableHead className="w-[200px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="text-sm font-medium truncate max-w-[200px]">{user.email ?? '—'}</div>
                      {user.username && (
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PLAN_BADGE_VARIANT[user.plan_type || 'free'] || 'secondary'}>
                        {(user.plan_type || 'free').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {(['free', 'pro', 'studio'] as const).map(plan => (
                          <Button
                            key={plan}
                            size="sm"
                            variant={user.plan_type === plan ? 'default' : 'outline'}
                            className="h-7 px-2 text-xs"
                            disabled={settingPlan === user.user_id || user.plan_type === plan}
                            onClick={() => handleSetPlan(user.user_id, plan)}
                          >
                            {user.plan_type === plan && <Check className="w-3 h-3 mr-1" />}
                            {plan.charAt(0).toUpperCase() + plan.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
