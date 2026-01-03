import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, bioTypes, tone, profileData } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const bioType of bioTypes) {
      const prompt = buildPrompt(bioType, tone, profileData);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an experienced biography writer. Write professional, engaging biographies based on the provided information. Do not hallucinate or add fictional details.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Save biography
      const { data: bioData, error: bioError } = await supabaseClient
        .from('biographies')
        .upsert({
          profile_id: profileId,
          bio_type: bioType,
          content,
          tone,
          generated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id,bio_type',
        })
        .select()
        .single();

      if (!bioError) {
        results.push(bioData);
      }

      // Log AI request
      await supabaseClient.from('ai_request_logs').insert({
        user_id: user.id,
        profile_id: profileId,
        action: `generate_${bioType}_bio`,
        tokens_used: data.usage?.total_tokens || 0,
        raw_prompt: prompt,
        response_summary: content.substring(0, 200),
      });
    }

    return new Response(JSON.stringify({ biographies: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-bio:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPrompt(bioType: string, tone: string, profileData: any) {
  const { name, jobTitle, website, bioNotes, socialLinks } = profileData;
  
  const lengths: Record<string, string> = {
    short: 'max 120 words',
    medium: 'about 300 words',
    long: '500-700 words',
    linkedin: 'max 300 words, suitable for LinkedIn summary',
    speaker: 'max 200 words, suitable for conference introductions',
    press: 'max 400 words, suitable for press releases',
    x_bio: 'max 160 characters',
    facebook_bio: 'max 200 words',
  };

  return `Write a ${bioType} biography (${lengths[bioType] || 'medium length'}) with a ${tone} tone.

Name: ${name}
Title: ${jobTitle || 'Not specified'}
Website: ${website || 'Not specified'}
Notes: ${bioNotes || 'No additional notes'}
Social Links: ${socialLinks?.join(', ') || 'None'}

Return only the biography text, no headers or labels.`;
}
