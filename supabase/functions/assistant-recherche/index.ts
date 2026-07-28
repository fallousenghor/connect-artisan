// Supabase Edge Function : "assistant-recherche"
// Interprète une requête en langage naturel (ex. "plombier à Dakar")
// et retourne { metier_id, ville } en utilisant l'API Claude (Anthropic).
//
// Déploiement :
//   supabase functions deploy assistant-recherche
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Appel depuis le frontend :
//   supabase.functions.invoke('assistant-recherche', { body: { query, metiers } })

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { query, metiers } = await req.json()

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Le champ "query" est requis.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY non configurée sur le projet Supabase.' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const listeMetiers = (metiers || [])
      .map((m) => `${m.id}: ${m.nom}`)
      .join('\n')

    const systemPrompt = `Tu es l'assistant de recherche d'ArtisanConnect, une plateforme sénégalaise qui met en relation des clients avec des artisans (plombiers, électriciens, maçons, etc.).

Voici la liste des métiers disponibles (id: nom) :
${listeMetiers}

À partir de la requête libre d'un client, réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, au format :
{"metier_id": <id du métier le plus pertinent ou null si aucun>, "ville": "<ville ou quartier mentionné, ou null>"}

N'invente jamais un id qui n'est pas dans la liste. Si la requête ne mentionne aucun métier de la liste, mets metier_id à null.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      return new Response(JSON.stringify({ error: 'Erreur API Claude', detail }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || '{}'
    const cleaned = text.replace(/^```json\s*|```$/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { metier_id: null, ville: null }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
