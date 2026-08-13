<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()

// ── PK battle state (tebak pemenang PK) ──
const PK_STATUS = { ACTIVE: 1, STARTING: 2, ENDED: 3, PREPARING: 4 } as const

const battle = computed(() => stream.battle.value as any)
const armies = computed(() => stream.battleArmies.value as any)

const pkActive = computed(() => {
  const s = battle.value?.status
  return s === PK_STATUS.STARTING || s === PK_STATUS.ACTIVE
})
const pkEnded = computed(() => battle.value?.status === PK_STATUS.ENDED)

function nameFromRaw(raw: any): string | null {
  if (!raw || typeof raw !== 'object') return null
  const direct = raw.teamName || raw.name || raw.nickname || raw.hostName || raw.displayName
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  const host = raw.hostUser || raw.host || raw.anchor
  if (host && typeof host === 'object') {
    const hn = host.nickname || host.uniqueId || host.name
    if (typeof hn === 'string' && hn.trim()) return hn.trim()
  }
  const users = raw.users || raw.contributors || raw.members
  if (Array.isArray(users) && users.length) {
    const first = (users[0] && (users[0].user || users[0])) || {}
    const un = first.nickname || first.uniqueId || first.name
    if (typeof un === 'string' && un.trim()) return un.trim()
  }
  return null
}

const pkTeams = computed<Array<{ name: string; score: number }> | null>(() => {
  if (!pkActive.value && !pkEnded.value) return null
  const b = battle.value
  const rawTeams = Array.isArray(b?.teams) ? b.teams : []
  const scores = Array.isArray(b?.scores) ? b.scores : []
  const teams: Array<{ name: string; score: number }> = []
  for (let i = 0; i < 2; i++) {
    teams.push({
      name: nameFromRaw(rawTeams[i]) || (i ? 'Tim Kanan' : 'Tim Kiri'),
      score: Number(scores[i] ?? 0) || 0
    })
  }
  const a = armies.value
  const hosts = a?.hosts || []
  if (Array.isArray(hosts) && hosts.length) {
    hosts.forEach((h: any) => {
      if (h.teamIdx < 0 || h.teamIdx > 1) return
      const t = teams[h.teamIdx]
      if (!t) return
      if (typeof h.teamTotalScore === 'number') t.score = h.teamTotalScore
      if (h.contributors?.[0]?.nickname) t.name = h.contributors[0].nickname
    })
  }
  return teams
})

const winner = computed<number>(() => {
  if (!pkEnded.value || !pkTeams.value) return -1
  const [l, r] = pkTeams.value
  return l.score > r.score ? 0 : r.score > l.score ? 1 : -1
})

// ── question / options (PK overrides generic poll) ──
const question = computed(() => (pkActive.value || pkEnded.value ? 'Tebak pemenang PK!' : props.settings.question || 'Siapa menang?'))
const options = computed<string[]>(() => {
  if (pkTeams.value) return pkTeams.value.map((t) => t.name)
  const o = props.settings.options
  return Array.isArray(o) && o.length >= 2 ? o.slice(0, 2) : ['Tim A', 'Tim B']
})
const keysA = computed<string[]>(() => (Array.isArray(props.settings.keysA) ? props.settings.keysA : ['a', '1']).map((s: string) => s.toLowerCase()))
const keysB = computed<string[]>(() => (Array.isArray(props.settings.keysB) ? props.settings.keysB : ['b', '2']).map((s: string) => s.toLowerCase()))

// ── votes (chat keyword, shared by generic + PK mode) ──
const votes = ref<Record<string, 0 | 1>>({})
let lastMsg = ''

watch(
  () => stream.messages.value[0],
  (m) => {
    if (!m || m.id === lastMsg) return
    lastMsg = m.id
    const c = m.comment.toLowerCase()
    if (keysA.value.some((k) => c.includes(k))) votes.value = { ...votes.value, [m.user]: 0 }
    else if (keysB.value.some((k) => c.includes(k))) votes.value = { ...votes.value, [m.user]: 1 }
  }
)

const countA = computed(() => Object.values(votes.value).filter((v) => v === 0).length)
const countB = computed(() => Object.values(votes.value).filter((v) => v === 1).length)
const totalVotes = computed(() => countA.value + countB.value)
const pctA = computed(() => (totalVotes.value ? Math.round((countA.value / totalVotes.value) * 100) : 0))
const pctB = computed(() => (totalVotes.value ? Math.round((countB.value / totalVotes.value) * 100) : 0))
</script>

<template>
  <div class="pp">
    <div class="pp-q">{{ pkActive ? '🔮' : '📊' }} {{ question }}</div>
    <div class="pp-row" :class="{ win: winner === 0 }">
      <div class="pp-label">
        <span>{{ options[0] }}<template v-if="pkTeams"> · {{ pkTeams[0].score.toLocaleString('id-ID') }} 💎</template></span>
        <span class="pp-key">ketik "{{ keysA[0] }}"</span>
      </div>
      <div class="pp-bar">
        <div class="pp-fill a" :style="{ width: pctA + '%' }"></div>
      </div>
      <div class="pp-meta">{{ pctA }}% · {{ countA }} vote</div>
    </div>
    <div class="pp-row" :class="{ win: winner === 1 }">
      <div class="pp-label">
        <span>{{ options[1] }}<template v-if="pkTeams"> · {{ pkTeams[1].score.toLocaleString('id-ID') }} 💎</template></span>
        <span class="pp-key">ketik "{{ keysB[0] }}"</span>
      </div>
      <div class="pp-bar">
        <div class="pp-fill b" :style="{ width: pctB + '%' }"></div>
      </div>
      <div class="pp-meta">{{ pctB }}% · {{ countB }} vote</div>
    </div>
    <div v-if="pkEnded" class="pp-winner">
      {{ winner === -1 ? '🤝 SERI!' : '🏆 ' + options[winner] + ' MENANG!' }}
    </div>
    <div class="pp-total">Total {{ totalVotes }} suara</div>
  </div>
</template>

<style scoped>
.pp {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.6cqw;
  padding: 2cqw 3cqw;
  border-radius: 2cqw;
  background: oklch(15% 0.02 280 / 0.72);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
}
.pp-q {
  font-size: 3.4cqw;
  font-weight: 700;
  margin-bottom: 0.4cqw;
}
.pp-row { display: flex; flex-direction: column; gap: 0.6cqw; }
.pp-row.win .pp-fill { background: linear-gradient(90deg, oklch(82% 0.15 195), oklch(85% 0.16 90)); }
.pp-label {
  font-size: 2.8cqw;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
}
.pp-key { font-size: 2cqw; color: oklch(80% 0.02 90); font-weight: 400; }
.pp-bar {
  height: 2.6cqw;
  border-radius: 999px;
  background: oklch(28% 0.03 280 / 0.8);
  overflow: hidden;
}
.pp-fill { height: 100%; transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
.pp-fill.a { background: linear-gradient(90deg, oklch(75% 0.19 350), oklch(70% 0.2 20)); }
.pp-fill.b { background: linear-gradient(90deg, oklch(82% 0.15 195), oklch(70% 0.17 230)); }
.pp-meta {
  font-family: var(--font-mono);
  font-size: 2.2cqw;
  color: oklch(80% 0.02 90);
}
.pp-winner {
  font-size: 3cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  text-align: center;
  text-shadow: 0 0 2cqw oklch(85% 0.16 90 / 0.5);
}
.pp-total { font-size: 2.4cqw; color: oklch(80% 0.02 90); text-align: center; }
</style>
