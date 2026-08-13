export interface StudioTemplate {
  id: string
  name: string
  description: string
  file: string
  features: string[]
  accent: string
  accent2: string
}

export const templates: StudioTemplate[] = [
  {
    id: 'classic',
    name: 'Hallmark Classic',
    description:
      'Overlay lengkap: alert gift bertingkat, goal bar, leaderboard, efek chat, hype meter, dan command kodam/nasib. Port dari overlay/ yang sudah battle-tested.',
    file: 'overlay-classic.html',
    features: ['Gift alert bertingkat', 'Goal bar', 'Gift leaderboard', 'Chat effects & hype', 'Kodam / nasib'],
    accent: 'oklch(75% 0.19 350)',
    accent2: 'oklch(82% 0.15 195)'
  },
  {
    id: 'goal',
    name: 'Goal Crusher',
    description:
      'Fokus ke target diamond: progress bar besar + leaderboard top supporter + alert gift minimal. Ringan dan mudah dibaca.',
    file: 'overlay-goal.html',
    features: ['Goal bar besar', 'Top supporter board', 'Gift alert minimal'],
    accent: 'oklch(85% 0.16 90)',
    accent2: 'oklch(75% 0.19 350)'
  },
  {
    id: 'alert',
    name: 'Alert Pop',
    description:
      'Super minimal: hanya alert gift + emoji chat yang melayang. Cocok untuk streamer yang sudah punya layar sendiri.',
    file: 'overlay-alert.html',
    features: ['Gift alert', 'Floating emoji chat'],
    accent: 'oklch(82% 0.15 195)',
    accent2: 'oklch(75% 0.19 350)'
  }
]

export function templateById(id: string): StudioTemplate | undefined {
  return templates.find((t) => t.id === id)
}
