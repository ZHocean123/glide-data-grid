import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import { GridCellKind, type GridColumn, type Item } from '../internal/data-grid/data-grid-types.js';

// Sample data for stories
const sampleData = [
  { name: "Deidre Morris", company: "GONKLE", email: "deidremorris@gonkle.com", phone: "+1 (867) 507-3332" },
  { name: "Sheryl Craig", company: "EVENTAGE", email: "sherylcraig@eventage.com", phone: "+1 (869) 520-2227" },
  { name: "Lidia Bowers", company: "ANOCHA", email: "lidiabowers@anocha.com", phone: "+1 (808) 414-3826" },
  { name: "Jones Norton", company: "REPETWIRE", email: "jonesnorton@repetwire.com", phone: "+1 (875) 582-3320" },
  { name: "Lula Bruce", company: "COMDOM", email: "lulabruce@comdom.com", phone: "+1 (873) 452-2472" },
  { name: "Larsen Montgomery", company: "SQUISH", email: "larsenmontgomery@squish.com", phone: "+1 (893) 482-3651" },
  { name: "Becky Bright", company: "COMCUR", email: "beckybright@comcur.com", phone: "+1 (879) 494-2331" },
  { name: "Charlotte Rowland", company: "FROLIX", email: "charlotterowland@frolix.com", phone: "+1 (861) 439-2134" },
  { name: "Sonya Hensley", company: "GEEKETRON", email: "sonyahensley@geeketron.com", phone: "+1 (802) 553-2194" },
  { name: "Stephenson Guthrie", company: "EXOSWITCH", email: "stephensonguthrie@exoswitch.com", phone: "+1 (903) 449-3271" },
];

const columns: GridColumn[] = [
  { title: "Name", width: 150 },
  { title: "Company", width: 150 },
  { title: "Email", width: 200 },
  { title: "Phone", width: 150 },
];

const getCellContent = (cell: Item) => {
  const [col, row] = cell;
  const dataRow = sampleData[row];
  const keys: (keyof typeof sampleData[0])[] = ["name", "company", "email", "phone"];
  const data = dataRow[keys[col]];
  
  return {
    kind: GridCellKind.Text,
    allowOverlay: true,
    displayData: data,
    data: data,
  };
};

const meta: Meta<typeof DataEditor> = {
  title: 'Glide-Data-Grid-Vue/Events',
  component: DataEditor,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'number' },
    height: { control: 'number' },
    rows: { control: 'number' },
    editable: { control: 'boolean' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CellEvents: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const lastEvent = ref('No event yet');
      const eventData = ref({});

      const handleCellClicked = (item: Item) => {
        lastEvent.value = 'Cell Clicked';
        eventData.value = { item };
        console.log('Cell clicked:', item);
      };

      const handleCellActivated = (item: Item) => {
        lastEvent.value = 'Cell Activated';
        eventData.value = { item };
        console.log('Cell activated:', item);
      };

      const handleCellEdited = (item: Item, newValue: any) => {
        lastEvent.value = 'Cell Edited';
        eventData.value = { item, newValue };
        console.log('Cell edited:', item, newValue);
      };

      const handleSelectionChanged = (selection: any) => {
        lastEvent.value = 'Selection Changed';
        eventData.value = { selection };
        console.log('Selection changed:', selection);
      };

      return {
        lastEvent,
        eventData,
        handleCellClicked,
        handleCellActivated,
        handleCellEdited,
        handleSelectionChanged,
        columns,
        sampleData,
        getCellContent,
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Last Event: {{ lastEvent }}</h3>
          <pre>{{ JSON.stringify(eventData, null, 2) }}</pre>
        </div>
        <DataEditor
          :width="800"
          :height="400"
          :columns="columns"
          :rows="sampleData.length"
          :get-cell-content="getCellContent"
          :editable="true"
          @cell-clicked="handleCellClicked"
          @cell-activated="handleCellActivated"
          @cell-edited="handleCellEdited"
          @selection-changed="handleSelectionChanged"
        />
      </div>
    `,
  }),
};

export const KeyboardEvents: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const lastKeyEvent = ref('No key event yet');
      const keyData = ref({});

      const handleKeyDown = (event: KeyboardEvent) => {
        lastKeyEvent.value = 'Key Down';
        keyData.value = { key: event.key, code: event.code, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey };
        console.log('Key down:', event);
      };

      const handleKeyUp = (event: KeyboardEvent) => {
        lastKeyEvent.value = 'Key Up';
        keyData.value = { key: event.key, code: event.code, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey };
        console.log('Key up:', event);
      };

      return {
        lastKeyEvent,
        keyData,
        handleKeyDown,
        handleKeyUp,
        columns,
        sampleData,
        getCellContent,
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Last Key Event: {{ lastKeyEvent }}</h3>
          <pre>{{ JSON.stringify(keyData, null, 2) }}</pre>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; background: #e6f7ff; border-radius: 4px;">
          <h4>Try these keyboard shortcuts:</h4>
          <ul>
            <li>Arrow keys - Navigate cells</li>
            <li>Enter - Edit cell</li>
            <li>Escape - Cancel editing</li>
            <li>Ctrl+C - Copy</li>
            <li>Ctrl+V - Paste</li>
            <li>Ctrl+A - Select all</li>
          </ul>
        </div>
        <DataEditor
          :width="800"
          :height="400"
          :columns="columns"
          :rows="sampleData.length"
          :get-cell-content="getCellContent"
          :editable="true"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
        />
      </div>
    `,
  }),
};

export const MouseEvents: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const lastMouseEvent = ref('No mouse event yet');
      const mouseData = ref({});

      const handleMouseDown = (event: MouseEvent) => {
        lastMouseEvent.value = 'Mouse Down';
        mouseData.value = { 
          button: event.button, 
          clientX: event.clientX, 
          clientY: event.clientY,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey
        };
        console.log('Mouse down:', event);
      };

      const handleMouseUp = (event: MouseEvent) => {
        lastMouseEvent.value = 'Mouse Up';
        mouseData.value = { 
          button: event.button, 
          clientX: event.clientX, 
          clientY: event.clientY,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey
        };
        console.log('Mouse up:', event);
      };

      const handleMouseMove = (event: MouseEvent) => {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
          lastMouseEvent.value = 'Mouse Move';
          mouseData.value = { 
            clientX: event.clientX, 
            clientY: event.clientY 
          };
        }
      };

      const handleContextMenu = (event: MouseEvent) => {
        lastMouseEvent.value = 'Context Menu';
        mouseData.value = { 
          clientX: event.clientX, 
          clientY: event.clientY 
        };
        console.log('Context menu:', event);
      };

      return {
        lastMouseEvent,
        mouseData,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        handleContextMenu,
        columns,
        sampleData,
        getCellContent,
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Last Mouse Event: {{ lastMouseEvent }}</h3>
          <pre>{{ JSON.stringify(mouseData, null, 2) }}</pre>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; background: #fffbe6; border-radius: 4px;">
          <h4>Try these mouse interactions:</h4>
          <ul>
            <li>Click - Select cell</li>
            <li>Double-click - Edit cell</li>
            <li>Right-click - Context menu</li>
            <li>Drag - Select multiple cells</li>
            <li>Shift+Click - Extend selection</li>
          </ul>
        </div>
        <DataEditor
          :width="800"
          :height="400"
          :columns="columns"
          :rows="sampleData.length"
          :get-cell-content="getCellContent"
          :editable="true"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mousemove="handleMouseMove"
          @contextmenu="handleContextMenu"
        />
      </div>
    `,
  }),
};