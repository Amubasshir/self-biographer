import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Template } from '@/types/database';
import { FileText, Crown } from 'lucide-react';

const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bio' | 'schema' | 'press_kit'>('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTemplates((data as Template[]) || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    filter === 'all' ? true : t.template_type === filter
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading font-serif mb-2">Templates</h1>
        <p className="text-muted-foreground">
          Browse available templates for biographies, schemas, and press kits
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-8">
        {['all', 'bio', 'schema', 'press_kit'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-small transition-colors ${
              filter === f
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All' : f === 'press_kit' ? 'Press Kit' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-border rounded-lg p-6 hover:border-foreground/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                {template.premium && (
                  <span className="inline-flex items-center gap-1 text-xs bg-foreground text-background px-2 py-0.5 rounded">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}
              </div>

              <h3 className="text-subheading font-serif mb-2">{template.name}</h3>
              <p className="text-small text-muted-foreground mb-4 line-clamp-2">
                {template.content}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                  {template.template_type.replace('_', ' ')}
                </span>
                {template.tone && (
                  <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                    {template.tone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;
