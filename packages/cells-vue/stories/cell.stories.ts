import { ref } from "vue";
import {
    BooleanCell,
    StarCellComponent,
    TagsCellComponent,
    UserProfileCellComponent,
    DropdownCellComponent,
    DatePickerCellComponent,
    ButtonCellComponent,
    MultiSelectCellComponent
} from "../src/index";

export default {
    title: "Extra Packages/Cells Vue",
    parameters: {
        layout: "centered",
    },
};

export const BooleanCellStory = {
    render: () => ({
        components: { BooleanCell },
        setup() {
            const value = ref(true);
            const handleToggle = (newValue: boolean) => {
                value.value = newValue;
            };
            return { value, handleToggle };
        },
        template: `
            <div style="width: 120px; height: 40px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <BooleanCell
                    :value="value"
                    @toggle="handleToggle"
                />
            </div>
        `
    })
};

export const StarCellStory = {
    render: () => ({
        components: { StarCellComponent },
        setup() {
            const cell = ref({
                rating: 3
            });
            const handleUpdate = (newCell: any) => {
                cell.value = newCell;
            };
            return { cell, handleUpdate };
        },
        template: `
            <div style="width: 200px; height: 40px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <StarCellComponent
                    :cell="cell"
                    @update="handleUpdate"
                />
            </div>
        `
    })
};

export const TagsCellStory = {
    render: () => ({
        components: { TagsCellComponent },
        setup() {
            const cell = ref({
                tags: ["Vue", "TypeScript", "Storybook"]
            });
            return { cell };
        },
        template: `
            <div style="width: 300px; height: 60px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <TagsCellComponent :cell="cell" />
            </div>
        `
    })
};

export const UserProfileCellStory = {
    render: () => ({
        components: { UserProfileCellComponent },
        setup() {
            const cell = ref({
                image: "https://via.placeholder.com/32",
                name: "John Doe",
                title: "Software Engineer"
            });
            return { cell };
        },
        template: `
            <div style="width: 250px; height: 60px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <UserProfileCellComponent :cell="cell" />
            </div>
        `
    })
};

export const DropdownCellStory = {
    render: () => ({
        components: { DropdownCellComponent },
        setup() {
            const cell = ref({
                value: "option2",
                options: [
                    { value: "option1", label: "Option 1" },
                    { value: "option2", label: "Option 2" },
                    { value: "option3", label: "Option 3" }
                ]
            });
            const handleUpdate = (newCell: any) => {
                cell.value = newCell;
            };
            return { cell, handleUpdate };
        },
        template: `
            <div style="width: 200px; height: 40px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <DropdownCellComponent
                    :cell="cell"
                    @update="handleUpdate"
                />
            </div>
        `
    })
};

export const MultiSelectCellStory = {
    render: () => ({
        components: { MultiSelectCellComponent },
        setup() {
            const cell = ref({
                values: ["option1", "option2"],
                options: [
                    { value: "option1", label: "Vue" },
                    { value: "option2", label: "React" },
                    { value: "option3", label: "Angular" }
                ]
            });
            return { cell };
        },
        template: `
            <div style="width: 300px; height: 60px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <MultiSelectCellComponent :cell="cell" />
            </div>
        `
    })
};

export const DatePickerCellStory = {
    render: () => ({
        components: { DatePickerCellComponent },
        setup() {
            const cell = ref({
                data: new Date("2023-01-15")
            });
            return { cell };
        },
        template: `
            <div style="width: 200px; height: 40px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <DatePickerCellComponent :cell="cell" />
            </div>
        `
    })
};

export const ButtonCellStory = {
    render: () => ({
        components: { ButtonCellComponent },
        setup() {
            const cell = ref({
                text: "Click Me",
                color: "#007bff"
            });
            const handleClick = () => {
                console.log("Button clicked!");
            };
            return { cell, handleClick };
        },
        template: `
            <div style="width: 150px; height: 40px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                <ButtonCellComponent
                    :cell="cell"
                    @click="handleClick"
                />
            </div>
        `
    })
};