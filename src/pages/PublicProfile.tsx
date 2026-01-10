import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { BioProfile, Biography, SchemaSnippet } from '@/types/database';
import { ArrowLeft, Globe, Linkedin, Twitter, Facebook, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [biographies, setBiographies] = useState<Biography[]>([]);
  const [schema, setSchema] = useState<SchemaSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  const fetchProfile = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('bio_profiles')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setNotFound(true);
        return;
      }

      setProfile(profileData as BioProfile);

      // Increment view count
      await supabase.rpc('increment_profile_view', { p_profile_id: profileData.id });

      // Fetch biographies
      const { data: biosData } = await supabase
        .from('biographies')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('created_at', { ascending: false });

      setBiographies((biosData as Biography[]) || []);

      // Fetch schema
      const { data: schemaData } = await supabase
        .from('schema_snippets')
        .select('*')
        .eq('profile_id', profileData.id)
        .maybeSingle();

      setSchema(schemaData as SchemaSnippet | null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (url: string) => {
    if (url.includes('linkedin')) return Linkedin;
    if (url.includes('twitter') || url.includes('x.com')) return Twitter;
    if (url.includes('facebook')) return Facebook;
    return Globe;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-display-sm font-serif mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This profile doesn't exist or is not published.
          </p>
          <Link to="/" className="text-foreground hover:underline inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const longBio = biographies.find((b) => b.bio_type === 'long');
  const shortBio = biographies.find((b) => b.bio_type === 'short');
  const socialLinks = (profile.social_links as string[]) || [];

  return (
    <>
      <Helmet>
        <title>{profile.name} | SelfBiographer</title>
        <meta name="description" content={shortBio?.content || `Biography of ${profile.name}`} />
        {schema?.schema_text && (
          <script type="application/ld+json">{schema.schema_text}</script>
        )}
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link to="/" className="text-subheading font-serif">
              SelfBiographer
            </Link>
          </div>
        </header>

        {/* Profile Content */}
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            {profile.main_image && (
              <img
                src={profile.main_image}
                alt={profile.name}
                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
              />
            )}
            <h1 className="text-display font-serif mb-3">{profile.name}</h1>
            {profile.job_title && (
              <p className="text-body-lg text-muted-foreground mb-4">
                {profile.job_title}
              </p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                {new URL(profile.website).hostname}
              </a>
            )}
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex justify-center gap-4 mb-12">
              {socialLinks.map((link) => {
                const Icon = getSocialIcon(link);
                return (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Biography */}
          {longBio && (
            <div className="prose prose-lg mx-auto">
              <div className="border-t border-border pt-8">
                <h2 className="text-heading font-serif mb-6">About</h2>
                <p className="text-body-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {longBio.content}
                </p>
              </div>
            </div>
          )}

          {!longBio && shortBio && (
            <div className="prose prose-lg mx-auto">
              <div className="border-t border-border pt-8">
                <h2 className="text-heading font-serif mb-6">About</h2>
                <p className="text-body-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {shortBio.content}
                </p>
              </div>
            </div>
          )}

          {/* Other Bios */}
          {biographies.length > 1 && (
            <div className="mt-16 border-t border-border pt-8">
              <h3 className="text-subheading font-serif mb-6">More Biographies</h3>
              <div className="space-y-6">
                {biographies
                  .filter((b) => b.id !== longBio?.id && b.id !== shortBio?.id)
                  .map((bio) => (
                    <div key={bio.id} className="border border-border rounded-lg p-6">
                      <h4 className="font-medium capitalize mb-2">
                        {bio.bio_type.replace('_', ' ')}
                      </h4>
                      <p className="text-muted-foreground">{bio.content}</p>
                    </div>
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

export default PublicProfile;
