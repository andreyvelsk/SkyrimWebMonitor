import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GeneralState } from './types/types.ts'

export const useMonitorStore = defineStore('monitor', () => {
    const generalState = ref<GeneralState>({
        health: 0,
        magicka: 0,
        stamina: 0
    })

    const calculatedStates = computed(() => ({
        health: generalState.value.health,
        magicka: generalState.value.magicka,
        stamina: generalState.value.stamina
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