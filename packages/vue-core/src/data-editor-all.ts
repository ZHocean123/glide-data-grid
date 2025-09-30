import { ref, computed } from 'vue';
import DataEditor from './components/DataEditor.vue';
import { AllCellRenderers } from './cells/index.js';
import { sprites } from './internal/data-grid/sprites.js';
import ImageWindowLoaderImpl from './common/image-window-loader.js';
import type { ImageWindowLoader } from './internal/data-grid/image-window-loader-interface.js';
import type { DataEditorProps, DataEditorRef } from './data-editor/data-editor.js';

export interface DataEditorAllProps extends Omit<DataEditorProps, 'imageWindowLoader'> {
    imageWindowLoader?: ImageWindowLoader;
}

export const DataEditorAll = {
    name: 'DataEditorAll',
    props: {
        imageWindowLoader: {
            type: Object,
            required: false,
        },
        // Include all other DataEditor props
        ...DataEditor.props,
    },
    emits: DataEditor.emits,
    setup(props: DataEditorAllProps, { emit, expose }) {
        const dataEditorRef = ref<DataEditorRef | null>(null);

        const allSprites = computed(() => {
            return { ...sprites, ...props.headerIcons };
        });

        const renderers = computed(() => {
            return props.renderers ?? AllCellRenderers;
        });

        const imageWindowLoader = computed(() => {
            return props.imageWindowLoader ?? new ImageWindowLoaderImpl();
        });

        // Expose methods to parent
        expose({
            focus: () => dataEditorRef.value?.focus(),
            // Add other methods as needed
        });

        return () => (
            <DataEditor
                {...props}
                renderers={renderers.value}
                headerIcons={allSprites.value}
                ref={dataEditorRef}
                imageWindowLoader={imageWindowLoader.value}
            />
        );
    },
};
