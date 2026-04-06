import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { GeneralState } from './types/types.ts'

const useMonitorStore = defineStore('monitor', () => {
    const generalState = ref<GeneralState>({
        health: 0,
        maxHealth: 0,
        magicka: 0,
        maxMagicka: 0,
        stamina: 0,
        maxStamina: 0
    })

    function setGeneralState(state: GeneralState) {
        generalState.value = state
    }
    return {    
        generalState,
        setGeneralState
    }
});

export default useMonitorStore