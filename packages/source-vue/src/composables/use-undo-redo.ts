import { ref, computed, type Ref } from 'vue'

export interface HistoryState {
    data: any
    timestamp: number
}

export function useUndoRedo(initialState: any) {
    const history = ref<HistoryState[]>([{ data: initialState, timestamp: Date.now() }])
    const currentIndex = ref(0)
    
    const canUndo = computed(() => currentIndex.value > 0)
    const canRedo = computed(() => currentIndex.value < history.value.length - 1)
    
    const pushState = (newState: any) => {
        // 移除当前索引之后的所有状态
        history.value = history.value.slice(0, currentIndex.value + 1)
        
        // 添加新状态
        history.value.push({
            data: newState,
            timestamp: Date.now()
        })
        
        currentIndex.value = history.value.length - 1
    }
    
    const undo = () => {
        if (canUndo.value) {
            currentIndex.value--
            return history.value[currentIndex.value].data
        }
        return null
    }
    
    const redo = () => {
        if (canRedo.value) {
            currentIndex.value++
            return history.value[currentIndex.value].data
        }
        return null
    }
    
    const clearHistory = () => {
        history.value = [{ data: initialState, timestamp: Date.now() }]
        currentIndex.value = 0
    }
    
    return {
        currentState: computed(() => history.value[currentIndex.value].data),
        canUndo,
        canRedo,
        pushState,
        undo,
        redo,
        clearHistory
    }
}