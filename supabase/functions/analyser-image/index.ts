// Supabase Edge Function : "analyser-image"
// Analyse la photo d'une réalisation (déjà uploadée sur Supabase Storage) avec
// la vision de Claude, pour suggérer un métier, des mots-clés et une description.
//
// Déploiement :
//   supabase functions deploy analyser-image
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   (même clé que la fonction "assistant-recherche" si déjà configurée)
//
// Appel depuis le frontend :
//   supabase.functions.invoke('analyser-image', { body: { image_url, metiers } })

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { image_url, metiers } = await req.json()

    if (!image_url || typeof image_url !== 'string') {
      return new Response(JSON.stringify({ error: 'Le champ "image_url" est requis.' }), {
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

    const listeMetiers = (metiers || []).map((m) => `${m.id}: ${m.nom}`).join('\n')

    const systemPrompt = `Tu es l'assistant de modération et de catégorisation d'ArtisanConnect, une plateforme sénégalaise qui met en relation des clients avec des artisans.

Voici la liste des métiers disponibles (id: nom) :
${listeMetiers}

Analyse la photo fournie, qui montre normalement la réalisation d'un artisan (plomberie, électricité, maçonnerie, peinture, menuiserie, etc.).

Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, au format :
{
  "metier_id": <id du métier le plus probable ou null si aucun ne correspond>,
  "tags": [<3 à 5 mots-clés courts en français décrivant ce qui est visible>],
  "description_suggestion": "<une phrase courte et concrète décrivant la réalisation visible, en français>",
  "conforme": <true si l'image montre bien un travail d'artisanat professionnel, false si elle semble hors-sujet ou inappropriée>
}

N'invente jamais un id qui n'est pas dans la liste.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url: image_url } },
              { type: 'text', text: 'Analyse cette photo selon les instructions.' },
            ],
          },
        ],
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
      parsed = { metier_id: null, tags: [], description_suggestion: '', conforme: true }
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
