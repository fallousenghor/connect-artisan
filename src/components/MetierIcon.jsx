import {
  Wrench, Zap, Hammer, Axe, Paintbrush, Car, Scissors, Flame, Wind, Sprout, Camera, Briefcase,
} from 'lucide-react'

const ICONS = {
  wrench: Wrench,
  zap: Zap,
  hammer: Hammer,
  axe: Axe,
  paintbrush: Paintbrush,
  car: Car,
  scissors: Scissors,
  flame: Flame,
  wind: Wind,
  sprout: Sprout,
  camera: Camera,
}

export default function MetierIcon({ icone, className = '', size = 18 }) {
  const Icon = ICONS[icone] || Briefcase
  return <Icon size={size} className={className} />
}
