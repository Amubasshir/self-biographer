import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { BioProfile, Biography, SchemaSnippet, PressKit, BioType, BioTone } from '@/types/database';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Globe,
  Code,
  FileText,
  Loader2,
  Copy,
  Check,
  Plus,
  X,
  Download,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const BIO_TYPES: { value: BioType; label: string }[] = [
  { value: 'short', label: 'Short Bio (120 words)' },
  { value: 'medium', label: 'Medium Bio (300 words)' },
  { value: 'long', label: 'Long Bio (500-700 words)' },
  { value: 'linkedin', label: 'LinkedIn Summary' },
  { value: 'speaker', label: 'Speaker Introduction' },
  { value: 'press', label: 'Press Release Bio' },
  { value: 'x_bio', label: 'X (Twitter) Bio' },
  { value: 'facebook_bio', label: 'Facebook Bio' },
];

const BIO_TONES: { value: BioTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' },
  { value: 'storytelling', label: 'Storytelling' },
];

const ProfileEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [biographies, setBiographies] = useState<Biography[]>([]);
  const [schema, setSchema] = useState<SchemaSnippet | null>(null);
  const [pressKit, setPressKit] = useState<PressKit | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [bioNotes, setBioNotes] = useState('');
  const [socialLinks, setSocialLinks] = useState<string[]>([]);
  const [newSocialLink, setNewSocialLink] = useState('');

  // Bio generation state
  const [selectedBioTypes, setSelectedBioTypes] = useState<BioType[]>(['short']);
  const [selectedTone, setSelectedTone] = useState<BioTone>('professional');

  // Press kit state
  const [pressKitSettings, setPressKitSettings] = useState({
    include_short_bio: true,
    include_long_bio: true,
    include_images: true,
    include_contacts: true,
  });

  useEffect(() => {
    if (id && user) {
      fetchProfileData();
    }
  }, [id, user]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('bio_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError || !profileData) throw profileError || new Error('Profile not found');
      
      setProfile(profileData as BioProfile);
      setName(profileData.name || '');
      setJobTitle(profileData.job_title || '');
      setWebsite(profileData.website || '');
      setBioNotes(profileData.bio_notes || '');
      setSocialLinks((profileData.social_links as string[]) || []);

      // Fetch biographies
      const { data: biosData } = await supabase
        .from('biographies')
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false });

      setBiographies((biosData as Biography[]) || []);

      // Fetch schema
      const { data: schemaData } = await supabase
        .from('schema_snippets')
        .select('*')
        .eq('profile_id', id)
        .maybeSingle();

      setSchema(schemaData as SchemaSnippet | null);

      // Fetch press kit
      const { data: pressKitData } = await supabase
        .from('press_kits')
        .select('*')
        .eq('profile_id', id)
        .maybeSingle();

      if (pressKitData) {
        const pkData = pressKitData as PressKit;
        setPressKit(pkData);
        setPressKitSettings({
          include_short_bio: pkData.include_short_bio,
          include_long_bio: pkData.include_long_bio,
          include_images: pkData.include_images,
          include_contacts: pkData.include_contacts,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('bio_profiles')
        .update({
          name,
          job_title: jobTitle,
          website,
          bio_notes: bioNotes,
          social_links: socialLinks,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Profile saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const generateBio = async () => {
    if (!profile || selectedBioTypes.length === 0) return;

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-bio', {
        body: {
          profileId: profile.id,
          bioTypes: selectedBioTypes,
          tone: selectedTone,
          profileData: {
            name,
            jobTitle,
            website,
            bioNotes,
            socialLinks,
          },
        },
      });

      if (response.error) throw response.error;

      // Refresh biographies
      const { data: biosData } = await supabase
        .from('biographies')
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false });

      setBiographies((biosData as Biography[]) || []);

      toast({
        title: 'Biographies generated',
        description: `Generated ${selectedBioTypes.length} biography/biographies successfully.`,
      });
    } catch (error) {
      console.error('Error generating bio:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate biography. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateSchema = async () => {
    if (!profile) return;

    setGenerating(true);
    try {
      // Generate JSON-LD schema locally (more reliable than AI)
      const schemaObj = {
        '@context': 'https://schema.org',
        '@type': profile.type === 'organization' ? 'Organization' : 'Person',
        name: name,
        jobTitle: jobTitle || undefined,
        url: website || undefined,
        sameAs: socialLinks.length > 0 ? socialLinks : undefined,
      };

      const schemaText = JSON.stringify(schemaObj, null, 2);

      // Save or update schema
      if (schema) {
        const { error } = await supabase
          .from('schema_snippets')
          .update({
            schema_text: schemaText,
            validated: true,
            validation_message: 'Valid JSON-LD',
          })
          .eq('id', schema.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('schema_snippets')
          .insert({
            profile_id: profile.id,
            schema_type: profile.type === 'organization' ? 'Organization' : 'Person',
            schema_text: schemaText,
            validated: true,
            validation_message: 'Valid JSON-LD',
          })
          .select()
          .single();

        if (error) throw error;
        setSchema(data as SchemaSnippet);
      }

      // Refresh schema
      const { data: schemaData } = await supabase
        .from('schema_snippets')
        .select('*')
        .eq('profile_id', id)
        .maybeSingle();

      setSchema(schemaData as SchemaSnippet | null);

      toast({
        title: 'Schema generated',
        description: 'JSON-LD schema has been generated successfully.',
      });
    } catch (error) {
      console.error('Error generating schema:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate schema',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard.',
    });
  };

  const togglePublish = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('bio_profiles')
        .update({ published: !profile.published })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, published: !profile.published });
      toast({
        title: profile.published ? 'Profile unpublished' : 'Profile published',
        description: profile.published
          ? 'Your profile is now private.'
          : `Your profile is now live at /p/${profile.slug}`,
      });
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast({
        title: 'Error',
        description: 'Failed to update publish status',
        variant: 'destructive',
      });
    }
  };

  const saveAndPublishPressKit = async () => {
    if (!profile) return;

    try {
      const slug = `${profile.slug}-kit`;

      if (pressKit) {
        const { error } = await supabase
          .from('press_kits')
          .update({
            ...pressKitSettings,
            is_published: true,
            slug,
          })
          .eq('id', pressKit.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('press_kits')
          .insert({
            profile_id: profile.id,
            ...pressKitSettings,
            is_published: true,
            slug,
          })
          .select()
          .single();

        if (error) throw error;
        setPressKit(data as PressKit);
      }

      // Refresh press kit
      const { data: pressKitData } = await supabase
        .from('press_kits')
        .select('*')
        .eq('profile_id', id)
        .maybeSingle();

      setPressKit(pressKitData as PressKit | null);

      toast({
        title: 'Press Kit published',
        description: `Your press kit is now live at /kit/${slug}`,
      });
    } catch (error) {
      console.error('Error publishing press kit:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish press kit',
        variant: 'destructive',
      });
    }
  };

  const addSocialLink = () => {
    if (newSocialLink && !socialLinks.includes(newSocialLink)) {
      setSocialLinks([...socialLinks, newSocialLink]);
      setNewSocialLink('');
    }
  };

  const removeSocialLink = (link: string) => {
    setSocialLinks(socialLinks.filter((l) => l !== link));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-heading font-serif">{name || 'Untitled Profile'}</h1>
              <p className="text-muted-foreground text-small">
                {profile?.published ? 'Published' : 'Draft'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={profile?.published ? 'outline' : 'hero'}
              onClick={togglePublish}
            >
              <Globe className="h-4 w-4 mr-2" />
              {profile?.published ? 'Unpublish' : 'Publish'}
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="bios">Biographies</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="presskit">Press Kit</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., CEO at Company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bioNotes">Bio Notes</Label>
                  <Textarea
                    id="bioNotes"
                    value={bioNotes}
                    onChange={(e) => setBioNotes(e.target.value)}
                    placeholder="Key achievements, background, notable projects..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes will be used by AI to generate your biography.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Social Links</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSocialLink}
                      onChange={(e) => setNewSocialLink(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      onKeyDown={(e) => e.key === 'Enter' && addSocialLink()}
                    />
                    <Button type="button" variant="outline" onClick={addSocialLink}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {socialLinks.map((link) => (
                        <span
                          key={link}
                          className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-small"
                        >
                          {new URL(link).hostname}
                          <button
                            onClick={() => removeSocialLink(link)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Biographies Tab */}
          <TabsContent value="bios" className="space-y-6">
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-subheading font-serif mb-4">Generate Biographies</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Select Biography Types</Label>
                  <div className="space-y-2">
                    {BIO_TYPES.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.value}
                          checked={selectedBioTypes.includes(type.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBioTypes([...selectedBioTypes, type.value]);
                            } else {
                              setSelectedBioTypes(
                                selectedBioTypes.filter((t) => t !== type.value)
                              );
                            }
                          }}
                        />
                        <label htmlFor={type.value} className="text-small">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select
                      value={selectedTone}
                      onValueChange={(v) => setSelectedTone(v as BioTone)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BIO_TONES.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={generateBio}
                    disabled={generating || selectedBioTypes.length === 0}
                    className="w-full"
                    variant="hero"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Biographies
                  </Button>
                </div>
              </div>
            </div>

            {/* Generated Biographies */}
            <div className="space-y-4">
              <h3 className="text-subheading font-serif">Generated Biographies</h3>
              {biographies.length === 0 ? (
                <p className="text-muted-foreground">
                  No biographies generated yet. Use the generator above to create your first bio.
                </p>
              ) : (
                biographies.map((bio) => (
                  <div key={bio.id} className="border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="font-medium capitalize">
                          {bio.bio_type.replace('_', ' ')}
                        </span>
                        <span className="text-muted-foreground text-small ml-2">
                          ({bio.tone})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bio.content || '')}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {bio.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-6">
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-subheading font-serif">JSON-LD Schema</h3>
                  <p className="text-muted-foreground text-small">
                    Structured data for search engines
                  </p>
                </div>
                <Button onClick={generateSchema} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Code className="h-4 w-4 mr-2" />
                  )}
                  {schema ? 'Regenerate' : 'Generate'} Schema
                </Button>
              </div>

              {schema ? (
                <div className="space-y-4">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-small">
                      {schema.schema_text}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(schema.schema_text || '')}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {schema.validated && (
                    <p className="text-small text-muted-foreground flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {schema.validation_message}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Generate a JSON-LD schema to help search engines understand your profile.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Press Kit Tab */}
          <TabsContent value="presskit" className="space-y-6">
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-subheading font-serif mb-4">Press Kit Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_short_bio"
                    checked={pressKitSettings.include_short_bio}
                    onCheckedChange={(checked) =>
                      setPressKitSettings({
                        ...pressKitSettings,
                        include_short_bio: !!checked,
                      })
                    }
                  />
                  <label htmlFor="include_short_bio">Include Short Bio</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_long_bio"
                    checked={pressKitSettings.include_long_bio}
                    onCheckedChange={(checked) =>
                      setPressKitSettings({
                        ...pressKitSettings,
                        include_long_bio: !!checked,
                      })
                    }
                  />
                  <label htmlFor="include_long_bio">Include Long Bio</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_images"
                    checked={pressKitSettings.include_images}
                    onCheckedChange={(checked) =>
                      setPressKitSettings({
                        ...pressKitSettings,
                        include_images: !!checked,
                      })
                    }
                  />
                  <label htmlFor="include_images">Include Images</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_contacts"
                    checked={pressKitSettings.include_contacts}
                    onCheckedChange={(checked) =>
                      setPressKitSettings({
                        ...pressKitSettings,
                        include_contacts: !!checked,
                      })
                    }
                  />
                  <label htmlFor="include_contacts">Include Contact Information</label>
                </div>

                <div className="pt-4">
                  <Button onClick={saveAndPublishPressKit} variant="hero">
                    <FileText className="h-4 w-4 mr-2" />
                    {pressKit?.is_published ? 'Update' : 'Publish'} Press Kit
                  </Button>
                </div>

                {pressKit?.is_published && (
                  <div className="pt-4 border-t border-border mt-4">
                    <p className="text-small text-muted-foreground mb-2">
                      Your press kit is live at:
                    </p>
                    <a
                      href={`/kit/${pressKit.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      {window.location.origin}/kit/{pressKit.slug}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileEditor;
