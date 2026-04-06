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
        health: generalState.value.health / generalState.value.maxHealth,
        magicka: generalState.value.magicka / generalState.value.maxMagicka,
        stamina: generalState.value.stamina / generalState.value.maxStamina
    }))

    function setGeneralState(state: GeneralState) {
        generalState.value = state
    }

    return {    
        calculatedStates,
        generalState,
        setGeneralState
    }
});