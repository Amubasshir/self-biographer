import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { BioProfile } from '@/types/database';
import {
  Plus,
  Settings,
  LogOut,
  User,
  FileText,
  CreditCard,
  LayoutDashboard,
  Trash2,
  Edit,
  Globe,
  MoreVertical,
  Eye,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Dashboard = () => {
  const { user, profile, signOut, role } = useAuth();
  const [profiles, setProfiles] = useState<BioProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('bio_profiles')
        .select('*')
        .eq('owner_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (profile && profile.profile_count >= profile.profile_limit) {
      toast({
        title: 'Profile limit reached',
        description: 'Please upgrade your plan to create more profiles.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const slug = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      const { data, error } = await supabase
        .from('bio_profiles')
        .insert({
          owner_id: user!.id,
          name: 'Untitled Profile',
          slug,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create profile');

      navigate(`/profile/${(data as BioProfile).id}`);
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create profile',
        variant: 'destructive',
      });
    }
  };

  const deleteProfile = async () => {
    if (!deleteProfileId) return;

    try {
      const { error } = await supabase
        .from('bio_profiles')
        .delete()
        .eq('id', deleteProfileId);

      if (error) throw error;

      setProfiles(profiles.filter((p) => p.id !== deleteProfileId));
      toast({
        title: 'Profile deleted',
        description: 'Your profile has been permanently deleted.',
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile',
        variant: 'destructive',
      });
    } finally {
      setDeleteProfileId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: FileText, label: 'Templates', href: '/templates' },
    { icon: CreditCard, label: 'Billing', href: '/billing' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  if (role === 'admin') {
    navItems.push({ icon: User, label: 'Admin', href: '/admin', active: false });
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <Link to="/" className="text-subheading font-serif">
            SelfBiographer
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-small transition-colors ${
                    item.active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium truncate">
                {profile?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {profile?.subscription_plan || 'Free'} Plan
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-small text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-heading font-serif">Your Profiles</h1>
            <p className="text-muted-foreground text-small mt-1">
              Manage your biographies and press kits
            </p>
          </div>
          <Button onClick={createProfile} variant="hero" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Profile
          </Button>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="border border-border rounded-lg p-6">
              <p className="text-muted-foreground text-small mb-1">Total Profiles</p>
              <p className="text-display-sm font-serif">{profile?.profile_count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {profile?.profile_limit || 1} allowed
              </p>
            </div>
            <div className="border border-border rounded-lg p-6">
              <p className="text-muted-foreground text-small mb-1">Published</p>
              <p className="text-display-sm font-serif">
                {profiles.filter((p) => p.published).length}
              </p>
            </div>
            <div className="border border-border rounded-lg p-6">
              <p className="text-muted-foreground text-small mb-1">Plan</p>
              <p className="text-display-sm font-serif capitalize">
                {profile?.subscription_plan || 'Free'}
              </p>
              <Link
                to="/billing"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center mt-1"
              >
                Upgrade <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Profiles List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-subheading font-serif mb-2">No profiles yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first biography profile to get started with generating AI-powered bios.
              </p>
              <Button onClick={createProfile} variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((bioProfile) => (
                <div
                  key={bioProfile.id}
                  className="border border-border rounded-lg p-6 hover:border-foreground/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-subheading font-serif">{bioProfile.name}</h3>
                        {bioProfile.published && (
                          <span className="inline-flex items-center gap-1 text-xs bg-foreground text-background px-2 py-0.5 rounded">
                            <Globe className="h-3 w-3" /> Published
                          </span>
                        )}
                      </div>
                      {bioProfile.job_title && (
                        <p className="text-muted-foreground">{bioProfile.job_title}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Last updated: {new Date(bioProfile.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/profile/${bioProfile.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {bioProfile.published && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/p/${bioProfile.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/profile/${bioProfile.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteProfileId(bioProfile.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the profile
              and all associated biographies, schemas, and press kits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProfile}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
