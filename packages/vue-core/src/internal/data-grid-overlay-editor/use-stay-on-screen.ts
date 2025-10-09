import { ref, onMounted, watch, computed, type Ref } from "vue";

function useRefState(): [Ref<HTMLElement | undefined>, (el: HTMLElement | null) => void] {
    const refState = ref<HTMLElement | null>();
    return [refState as Ref<HTMLElement | undefined>, (el: HTMLElement | null) => {
        refState.value = el;
    }];
}

interface StayOnScreen {
    ref: (el: HTMLElement | null) => void;
    style: { transform: string };
}

export function useStayOnScreen(): StayOnScreen {
    const [ref, setRef] = useRefState();
    const xOffset = ref(0);
    const isIntersecting = ref(true);

    onMounted(() => {
        if (ref.value === undefined) return;
        if (!("IntersectionObserver" in window)) return;

        const observer = new IntersectionObserver(
            ents => {
                if (ents.length === 0) return;
                isIntersecting.value = ents[0].isIntersecting;
            },
            { threshold: 1 }
        );
        observer.observe(ref.value);

        return () => observer.disconnect();
    });

    watch([ref, isIntersecting], ([refVal, isIntersectingVal]) => {
        if (isIntersectingVal || refVal === undefined) return;

        let rafHandle: number | undefined;
        const fn = () => {
            const { right: refRight } = refVal!.getBoundingClientRect();

            xOffset.value = Math.min(xOffset.value + window.innerWidth - refRight - 10, 0);
            rafHandle = requestAnimationFrame(fn);
        };

        rafHandle = requestAnimationFrame(fn);
        return () => {
            if (rafHandle !== undefined) {
                cancelAnimationFrame(rafHandle);
            }
        };
    });

    const style = computed(() => {
        return { transform: `translateX(${xOffset.value}px)` };
    });

    return {
        ref: setRef,
        style: style.value,
    };
}