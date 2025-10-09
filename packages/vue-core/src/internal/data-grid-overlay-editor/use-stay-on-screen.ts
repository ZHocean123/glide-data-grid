import { ref, watch, onMounted, onUnmounted, Ref } from "vue";
import type { Rectangle } from "../data-grid/data-grid-types.js";

export const useStayOnScreen = (
    refVal: Ref<HTMLElement | null>,
    containerRect: Ref<Rectangle>,
    targetRect: Ref<Rectangle>,
    targetLocation: Ref<"center" | "below" | "above" | undefined>,
    getIdealBounds: () => Partial<Rectangle>,
    updateBounds: (bounds: Partial<Rectangle>) => void
) => {
    const lastContainerRect = ref<Rectangle>();
    const lastTargetRect = ref<Rectangle>();
    const lastBounds = ref<Partial<Rectangle>>();
    const rafId = ref<number>();
    const lastIdealBounds = ref<Partial<Rectangle>>();

    const update = () => {
        if (refVal.value === null) return;
        const { right: refRight } = refVal.value.getBoundingClientRect();

        if (
            lastContainerRect.value === containerRect.value &&
            lastTargetRect.value === targetRect.value &&
            lastBounds.value !== undefined &&
            lastBounds.value.x === getIdealBounds().x &&
            lastBounds.value.y === getIdealBounds().y &&
            lastIdealBounds.value?.width === getIdealBounds().width &&
            lastIdealBounds.value?.height === getIdealBounds().height &&
            refRight === (lastBounds.value.x + (lastBounds.value.width ?? 0))
        )
            return;

        const { x: idealX, y: idealY, width: idealWidth, height: idealHeight } = getIdealBounds();

        const { x: containerX, y: containerY, width: containerWidth, height: containerHeight } =
            containerRect.value;

        const { x: targetX, y: targetY, width: targetWidth, height: targetHeight } =
            targetRect.value;

        let targetLocationVal = targetLocation.value;

        let newX = idealX;
        let newY = idealY;
        let newWidth = idealWidth;
        let newHeight = idealHeight;

        const xSpaceAvailable = containerX + containerWidth - targetX - targetWidth;
        const leftSpaceAvailable = targetX - containerX;

        const ySpaceAvailable = containerY + containerHeight - targetY - targetHeight;
        const topSpaceAvailable = targetY - containerY;

        if (targetLocationVal === undefined) {
            // try to fit below
            if (ySpaceAvailable > (idealHeight ?? 0)) {
                targetLocationVal = "below";
            } else if (topSpaceAvailable > (idealHeight ?? 0)) {
                targetLocationVal = "above";
            } else {
                // not enough space either way, just pick the bigger side
                targetLocationVal = ySpaceAvailable > topSpaceAvailable ? "below" : "above";
            }
        }

        if (targetLocationVal === "below") {
            newY = targetY + targetHeight;
            if ((newY + (newHeight ?? 0)) > containerY + containerHeight) {
                newY = containerY + containerHeight - (newHeight ?? 0);
            }
        } else if (targetLocationVal === "above") {
            newY = targetY - (newHeight ?? 0);
            if (newY < containerY) {
                newY = containerY;
            }
        }

        // If we have a lot more space on the left, move there
        if (xSpaceAvailable < (idealWidth ?? 0) && leftSpaceAvailable > (idealWidth ?? 0)) {
            newX = targetX - (idealWidth ?? 0);
            if (newX < containerX) {
                newX = containerX;
            }
        }

        // If we have no space on the right, move left
        if ((newX + (idealWidth ?? 0)) > containerX + containerWidth) {
            newX = containerX + containerWidth - (idealWidth ?? 0);
        }

        // If we have no space on the left, move right
        if ((newX ?? 0) < containerX) {
            newX = containerX;
        }

        // If we have no space on the top, move down
        if ((newY ?? 0) < containerY) {
            newY = containerY;
        }

        // If we have no space on the bottom, move up
        if ((newY + (newHeight ?? 0)) > containerY + containerHeight) {
            newY = containerY + containerHeight - (newHeight ?? 0);
        }

        lastContainerRect.value = containerRect.value;
        lastTargetRect.value = targetRect.value;
        lastBounds.value = {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
        };
        lastIdealBounds.value = {
            width: idealWidth,
            height: idealHeight,
        };

        updateBounds(lastBounds.value);
    };

    const rafUpdate = () => {
        rafId.value = requestAnimationFrame(() => {
            update();
            rafUpdate();
        });
    };

    onMounted(() => {
        update();
        rafUpdate();
    });

    onUnmounted(() => {
        if (rafId.value !== undefined) {
            cancelAnimationFrame(rafId.value);
        }
    });

    const onResize = () => {
        update();
    };

    const ro = new ResizeObserver(onResize);
    watch(
        refVal,
        (newVal, oldVal) => {
            if (oldVal !== undefined && oldVal !== null) {
                ro.unobserve(oldVal);
            }
            if (newVal !== null) {
                ro.observe(newVal);
                onResize();
            }
        },
        {
            immediate: true,
        }
    );

    watch([containerRect, targetRect, targetLocation], update);
    return () => {
        if (rafId.value !== undefined) {
            cancelAnimationFrame(rafId.value);
        }
        ro.disconnect();
    };
};