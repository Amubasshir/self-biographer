import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Loader2 } from 'lucide-react';

const Settings = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Settings saved',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading font-serif mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <div className="border border-border rounded-lg p-6 mb-8">
        <h2 className="text-subheading font-serif mb-6">Profile Information</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Avatar'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{profile?.full_name || user?.email}</p>
            <p className="text-small text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Account Info */}
      <div className="border border-border rounded-lg p-6">
        <h2 className="text-subheading font-serif mb-6">Account Information</h2>

        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium capitalize">{profile?.subscription_plan || 'Free'}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Profile Limit</span>
            <span className="font-medium">{profile?.profile_limit || 1}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Profiles Used</span>
            <span className="font-medium">{profile?.profile_count || 0}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">Member Since</span>
            <span className="font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
