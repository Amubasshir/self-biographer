import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, FileText, Activity, Search, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminUser {
  id: string;
  full_name: string | null;
  subscription_plan: string;
  profile_count: number;
  profile_limit: number;
  created_at: string;
  email?: string;
}

const Admin = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfiles: 0,
    totalAIRequests: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers((usersData as AdminUser[]) || []);

      // Fetch stats
      const { count: profileCount } = await supabase
        .from('bio_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: aiCount } = await supabase
        .from('ai_request_logs')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersData?.length || 0,
        totalProfiles: profileCount || 0,
        totalAIRequests: aiCount || 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId: string, plan: string) => {
    try {
      const planLimits: Record<string, number> = {
        free: 1,
        pro: 10,
        agency: 999,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: plan,
          profile_limit: planLimits[plan],
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.id === userId
            ? { ...u, subscription_plan: plan, profile_limit: planLimits[plan] }
            : u
        )
      );

      toast({
        title: 'Plan updated',
        description: `User plan has been updated to ${plan}`,
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user plan',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading font-serif mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and monitor platform activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground text-small">Total Users</p>
          </div>
          <p className="text-display-sm font-serif">{stats.totalUsers}</p>
        </div>
        <div className="border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground text-small">Total Profiles</p>
          </div>
          <p className="text-display-sm font-serif">{stats.totalProfiles}</p>
        </div>
        <div className="border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <p className="text-muted-foreground text-small">AI Requests</p>
          </div>
          <p className="text-display-sm font-serif">{stats.totalAIRequests}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-subheading font-serif">Users</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-small font-medium">User</th>
                <th className="text-left p-4 text-small font-medium">Plan</th>
                <th className="text-left p-4 text-small font-medium">Profiles</th>
                <th className="text-left p-4 text-small font-medium">Joined</th>
                <th className="text-left p-4 text-small font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="p-4">
                    <p className="font-medium">{user.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{user.id}</p>
                  </td>
                  <td className="p-4">
                    <Select
                      value={user.subscription_plan}
                      onValueChange={(v) => updateUserPlan(user.id, v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-small">
                    {user.profile_count} / {user.profile_limit}
                  </td>
                  <td className="p-4 text-small">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>View Profiles</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
