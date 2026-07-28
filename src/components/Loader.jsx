export default function Loader({ label = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink/50">
      <div className="w-8 h-8 border-[3px] border-sand-dark border-t-clay rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
