import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import type { BioProfile, Biography, PressKit } from '@/types/database';
import { ArrowLeft, Download, Mail, Globe, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PublicPressKit = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [pressKit, setPressKit] = useState<PressKit | null>(null);
  const [biographies, setBiographies] = useState<Biography[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPressKit();
    }
  }, [slug]);

  const fetchPressKit = async () => {
    try {
      // Fetch press kit by slug
      const { data: pressKitData, error: pressKitError } = await supabase
        .from('press_kits')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (pressKitError) throw pressKitError;
      if (!pressKitData) {
        setNotFound(true);
        return;
      }

      setPressKit(pressKitData as PressKit);

      // Increment view count
      await supabase
        .from('press_kits')
        .update({ views_count: (pressKitData.views_count || 0) + 1 })
        .eq('id', pressKitData.id);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('bio_profiles')
        .select('*')
        .eq('id', pressKitData.profile_id)
        .single();

      setProfile(profileData as BioProfile);

      // Fetch biographies
      const { data: biosData } = await supabase
        .from('biographies')
        .select('*')
        .eq('profile_id', pressKitData.profile_id)
        .order('created_at', { ascending: false });

      setBiographies((biosData as Biography[]) || []);
    } catch (error) {
      console.error('Error fetching press kit:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const downloadPressKit = async () => {
    if (!pressKit || !profile) return;

    // Update download count
    await supabase
      .from('press_kits')
      .update({ downloads_count: (pressKit.downloads_count || 0) + 1 })
      .eq('id', pressKit.id);

    // Generate press kit content
    const shortBio = biographies.find((b) => b.bio_type === 'short')?.content || '';
    const longBio = biographies.find((b) => b.bio_type === 'long')?.content || '';

    let content = `PRESS KIT\n${'='.repeat(50)}\n\n`;
    content += `${profile.name}\n`;
    if (profile.job_title) content += `${profile.job_title}\n`;
    content += '\n';

    if (pressKit.include_short_bio && shortBio) {
      content += `SHORT BIOGRAPHY\n${'-'.repeat(30)}\n${shortBio}\n\n`;
    }

    if (pressKit.include_long_bio && longBio) {
      content += `FULL BIOGRAPHY\n${'-'.repeat(30)}\n${longBio}\n\n`;
    }

    if (pressKit.include_contacts) {
      content += `CONTACT INFORMATION\n${'-'.repeat(30)}\n`;
      if (profile.website) content += `Website: ${profile.website}\n`;
      const socialLinks = (profile.social_links as string[]) || [];
      socialLinks.forEach((link) => {
        content += `${link}\n`;
      });
    }

    // Create download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, '-').toLowerCase()}-press-kit.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !pressKit || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-display-sm font-serif mb-4">Press Kit Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This press kit doesn't exist or is not published.
          </p>
          <Link to="/" className="text-foreground hover:underline inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const shortBio = biographies.find((b) => b.bio_type === 'short');
  const longBio = biographies.find((b) => b.bio_type === 'long');
  const socialLinks = (profile.social_links as string[]) || [];

  return (
    <>
      <Helmet>
        <title>{profile.name} - Press Kit | SelfBiographer</title>
        <meta name="description" content={`Press kit for ${profile.name}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-subheading font-serif">
              SelfBiographer
            </Link>
            <Button onClick={downloadPressKit} variant="hero">
              <Download className="h-4 w-4 mr-2" />
              Download Press Kit
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-small uppercase tracking-widest text-muted-foreground mb-4">
              Press Kit
            </p>
            <h1 className="text-display font-serif mb-3">{profile.name}</h1>
            {profile.job_title && (
              <p className="text-body-lg text-muted-foreground">{profile.job_title}</p>
            )}
          </div>

          {/* Profile Image */}
          {pressKit.include_images && profile.main_image && (
            <div className="mb-12">
              <h2 className="text-heading font-serif mb-6">Photos</h2>
              <div className="border border-border rounded-lg p-6">
                <img
                  src={profile.main_image}
                  alt={profile.name}
                  className="w-48 h-48 rounded-lg object-cover"
                />
                <p className="text-small text-muted-foreground mt-2">
                  Right-click to download
                </p>
              </div>
            </div>
          )}

          {/* Short Bio */}
          {pressKit.include_short_bio && shortBio && (
            <div className="mb-12">
              <h2 className="text-heading font-serif mb-6">Short Biography</h2>
              <div className="border border-border rounded-lg p-6">
                <p className="text-body-lg text-muted-foreground whitespace-pre-wrap">
                  {shortBio.content}
                </p>
              </div>
            </div>
          )}

          {/* Long Bio */}
          {pressKit.include_long_bio && longBio && (
            <div className="mb-12">
              <h2 className="text-heading font-serif mb-6">Full Biography</h2>
              <div className="border border-border rounded-lg p-6">
                <p className="text-body-lg text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {longBio.content}
                </p>
              </div>
            </div>
          )}

          {/* Contact Info */}
          {pressKit.include_contacts && (
            <div className="mb-12">
              <h2 className="text-heading font-serif mb-6">Contact Information</h2>
              <div className="border border-border rounded-lg p-6 space-y-4">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-5 w-5" />
                    {profile.website}
                  </a>
                )}
                {socialLinks.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-5 w-5" />
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-16">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="text-small text-muted-foreground">
              Powered by{' '}
              <Link to="/" className="hover:text-foreground">
                SelfBiographer
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PublicPressKit;
