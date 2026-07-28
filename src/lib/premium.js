export function isPremium(artisan) {
  return !!artisan?.premium_until && new Date(artisan.premium_until) > new Date()
}

export const PLANS = {
  mensuel: { amount: 2000, label: 'Mensuel', sousLabel: '/mois' },
  annuel: { amount: 20000, label: 'Annuel', sousLabel: '/an', economie: '17% d’économie vs mensuel' },
}
