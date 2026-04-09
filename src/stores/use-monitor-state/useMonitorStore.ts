import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { GeneralState } from './types/types.ts';

export const useMonitorStore = defineStore('monitor', () => {
    const generalState = ref<GeneralState>({
        health: 0,
        magicka: 0,
        stamina: 0,
        healthBase: 0,
        magickaBase: 0,
        staminaBase: 0
    });

    const calculatedStates = computed(() => ({
        health: getPercentage(generalState.value.health, generalState.value.healthBase),
        magicka: getPercentage(generalState.value.magicka, generalState.value.magickaBase),
        stamina: getPercentage(generalState.value.stamina, generalState.value.staminaBase)
    }));

    function getPercentage(value: number, maxValue: number): number {
        return maxValue > 0 ? (value / maxValue) * 100 : 0;
    }

    function setGeneralState(state: Partial<GeneralState>) {
        generalState.value = { ...generalState.value, ...state };
    }

    return {    
        calculatedStates,
        generalState,
        setGeneralState
    };
});