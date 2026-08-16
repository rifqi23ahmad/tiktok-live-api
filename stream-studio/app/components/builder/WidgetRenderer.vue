<script setup lang="ts">
import { computed } from 'vue'
import type { WidgetType } from '~/composables/useWidgetRegistry'
import GiftAlert from '~/components/widgets/GiftAlert.vue'
import GoalBar from '~/components/widgets/GoalBar.vue'
import MiniGame from '~/components/widgets/MiniGame.vue'
import PollPrediction from '~/components/widgets/PollPrediction.vue'
import GiftLeaderboard from '~/components/widgets/GiftLeaderboard.vue'
import ChatEffects from '~/components/widgets/ChatEffects.vue'
import AvatarArena from '~/components/widgets/AvatarArena.vue'
import TeamBattle from '~/components/widgets/TeamBattle.vue'
import LoyaltyPoints from '~/components/widgets/LoyaltyPoints.vue'
import LuckyWheel from '~/components/widgets/LuckyWheel.vue'
import PanjatPinang from '~/components/widgets/PanjatPinang.vue'

const props = defineProps<{ type: WidgetType; settings: Record<string, any> }>()

const map: Record<WidgetType, any> = {
  'gift-alert': GiftAlert,
  'goal-bar': GoalBar,
  'mini-game': MiniGame,
  'poll-prediction': PollPrediction,
  'gift-leaderboard': GiftLeaderboard,
  'chat-effects': ChatEffects,
  'avatar-arena': AvatarArena,
  'team-battle': TeamBattle,
  'loyalty-points': LoyaltyPoints,
  'lucky-wheel': LuckyWheel,
  'panjat-pinang': PanjatPinang
}

const comp = computed(() => map[props.type])
</script>

<template>
  <component :is="comp" :settings="settings" />
</template>
