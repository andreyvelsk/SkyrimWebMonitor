import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GeneralState } from './types/types.ts'

export const useMonitorStore = defineStore('monitor', () => {
    const generalState = ref<GeneralState>({
        health: 0,
        maxHealth: 0,
        magicka: 0,
        maxMagicka: 0,
        stamina: 0,
        maxStamina: 0
    })

    const calculatedStates = computed(() => ({
        health: getPercentage(generalState.value.health, generalState.value.maxHealth),
        magicka: getPercentage(generalState.value.magicka, generalState.value.maxMagicka),
        stamina: getPercentage(generalState.value.stamina, generalState.value.maxStamina)
    }))

    function getPercentage(value: number, maxValue: number): number {
        return maxValue > 0 ? (value / maxValue) * 100 : 0
    }

    function setGeneralState(state: GeneralState) {
        generalState.value = state
    }

    return {    
        calculatedStates,
        generalState,
        setGeneralState
    }
});