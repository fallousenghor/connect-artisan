import { Phone, MessageCircle } from 'lucide-react'
import { telHref, whatsappHref } from '../lib/utils'

export default function ContactButtons({ telephone, whatsapp, nom, metier, compact = false }) {
  const message = `Bonjour ${nom}, je vous ai trouvé sur ArtisanConnect. Je cherche un(e) ${metier?.toLowerCase() || 'artisan'} pour un service.`

  if (!telephone && !whatsapp) return null

  return (
    <div className={`flex gap-2 ${compact ? '' : 'w-full'}`}>
      {whatsapp && (
        <a
          href={whatsappHref(whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 rounded-md bg-green text-white font-semibold hover:bg-green-dark active:scale-[0.98] transition ${
            compact ? 'p-2.5' : 'flex-1 py-2.5 px-4 text-sm'
          }`}
          aria-label="Contacter sur WhatsApp"
        >
          <MessageCircle size={compact ? 18 : 16} />
          {!compact && 'WhatsApp'}
        </a>
      )}
      {telephone && (
        <a
          href={telHref(telephone)}
          className={`flex items-center justify-center gap-2 rounded-md bg-fb text-white font-semibold hover:bg-fb-dark active:scale-[0.98] transition ${
            compact ? 'p-2.5' : 'flex-1 py-2.5 px-4 text-sm'
          }`}
          aria-label="Appeler"
        >
          <Phone size={compact ? 18 : 16} />
          {!compact && 'Appeler'}
        </a>
      )}
    </div>
  )
}
