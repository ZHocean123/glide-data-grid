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
  title: 'Glide-Data-Grid-Vue/Accessibility',
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

export const BasicAccessibility: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const lastA11yEvent = ref('No accessibility event yet');
      const a11yData = ref({});

      const handleA11yEvent = (eventName: string, data: any) => {
        lastA11yEvent.value = eventName;
        a11yData.value = data;
        console.log(`Accessibility event: ${eventName}`, data);
      };

      return {
        lastA11yEvent,
        a11yData,
        handleA11yEvent,
        columns,
        sampleData,
        getCellContent,
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Accessibility Features</h3>
          <p>Last Event: {{ lastA11yEvent }}</p>
          <pre>{{ JSON.stringify(a11yData, null, 2) }}</pre>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; background: #e6f7ff; border-radius: 4px;">
          <h4>Keyboard Navigation:</h4>
          <ul>
            <li>Tab - Move focus to the grid</li>
            <li>Arrow keys - Navigate cells</li>
            <li>Enter - Edit cell or activate</li>
            <li>Escape - Exit edit mode</li>
            <li>Home/End - Jump to first/last cell in row</li>
            <li>Page Up/Down - Scroll up/down one page</li>
            <li>Ctrl+Home/End - Jump to first/last cell</li>
          </ul>
        </div>
        <DataEditor
          :width="800"
          :height="400"
          :columns="columns"
          :rows="sampleData.length"
          :get-cell-content="getCellContent"
          :editable="true"
          aria-label="Data grid with employee information"
          @cell-focused="(item) => handleA11yEvent('Cell Focused', item)"
          @cell-activated="(item) => handleA11yEvent('Cell Activated', item)"
        />
      </div>
    `,
  }),
};

export const ScreenReaderMode: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const screenReaderMode = ref(true);
      const announceMessage = ref('');
      
      const handleAnnouncement = (message: string) => {
        announceMessage.value = message;
        // In a real application, this would be sent to a screen reader
        console.log('Screen reader announcement:', message);
      };
      
      const handleCellFocused = (item: Item) => {
        const [col, row] = item;
        const dataRow = sampleData[row];
        const keys: (keyof typeof sampleData[0])[] = ["name", "company", "email", "phone"];
        const value = dataRow[keys[col]];
        const columnName = columns[col].title;
        
        handleAnnouncement(`Row ${row + 1}, Column ${columnName}, ${value}`);
      };
      
      return {
        screenReaderMode,
        announceMessage,
        handleCellFocused,
        columns,
        sampleData,
        getCellContent,
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Screen Reader Mode</h3>
          <p>
            <label>
              <input type="checkbox" v-model="screenReaderMode" />
              Enable Screen Reader Mode
            </label>
          </p>
          <div v-if="announceMessage" style="margin-top: 10px; padding: 10px; background: #e6f7ff; border-radius: 4px;">
            <strong>Last Announcement:</strong> {{ announceMessage }}
          </div>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; background: #fffbe6; border-radius: 4px;">
          <h4>Screen Reader Features:</h4>
          <ul>
            <li>ARIA labels and descriptions</li>
            <li>Row and column headers</li>
            <li>Cell position announcements</li>
            <li>Selection state announcements</li>
            <li>Edit mode announcements</li>
          </ul>
        </div>
        <DataEditor
          :width="800"
          :height="400"
          :columns="columns"
          :rows="sampleData.length"
          :get-cell-content="getCellContent"
          :editable="true"
          :screen-reader-mode="screenReaderMode"
          aria-label="Employee data grid with screen reader support"
          @cell-focused="handleCellFocused"
        />
      </div>
    `,
  }),
};

export const HighContrastMode: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const highContrastMode = ref(false);
      
      return {
        highContrastMode,
        columns,
        sampleData,
        getCellContent,
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>High Contrast Mode</h3>
          <p>
            <label>
              <input type="checkbox" v-model="highContrastMode" />
              Enable High Contrast Mode
            </label>
          </p>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; background: #fffbe6; border-radius: 4px;">
          <h4>High Contrast Features:</h4>
          <ul>
            <li>Increased color contrast ratios</li>
            <li>Enhanced focus indicators</li>
            <li>Clearer cell borders</li>
            <li>More pronounced selection highlighting</li>
          </ul>
        </div>
        <DataEditor
          :width="800"
          :height="400"
          :columns="columns"
          :rows="sampleData.length"
          :get-cell-content="getCellContent"
          :editable="true"
          :high-contrast-mode="highContrastMode"
          :theme="highContrastMode ? { baseTheme: 'dark', accentColor: '#ffff00' } : {}"
          aria-label="Employee data grid with high contrast support"
        />
      </div>
    `,
  }),
};

export const KeyboardNavigation: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const currentFocus = ref('No focus');
      const navigationHistory = ref<string[]>([]);
      
      const handleCellFocused = (item: Item) => {
        const [col, row] = item;
        const columnName = columns[col].title;
        const dataRow = sampleData[row];
        const keys: (keyof typeof sampleData[0])[] = ["name", "company", "email", "phone"];
        const value = dataRow[keys[col]];
        
        currentFocus.value = `Row ${row + 1}, Column ${columnName}: ${value}`;
        navigationHistory.value.push(currentFocus.value);
        
        // Keep only last 10 entries
        if (navigationHistory.value.length > 10) {
          navigationHistory.value = navigationHistory.value.slice(-10);
        }
      };
      
      return {
        currentFocus,
        navigationHistory,
        handleCellFocused,
        columns,
        sampleData,
        getCellContent,
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Keyboard Navigation</h3>
          <p><strong>Current Focus:</strong> {{ currentFocus }}</p>
          <div>
            <strong>Navigation History:</strong>
            <ul style="max-height: 200px; overflow-y: auto;">
              <li v-for="(entry, index) in navigationHistory.slice().reverse()" :key="index">
                {{ entry }}
              </li>
            </ul>
          </div>
        </div>
        <div style="margin-bottom: 20px; padding: 10px; background: #e6f7ff; border-radius: 4px;">
          <h4>Advanced Keyboard Shortcuts:</h4>
          <ul>
            <li><kbd>Ctrl + Arrow</kbd> - Jump to edge of data</li>
            <li><kbd>Shift + Arrow</kbd> - Extend selection</li>
            <li><kbd>Ctrl + Shift + Arrow</kbd> - Extend selection to edge</li>
            <li><kbd>Ctrl + A</kbd> - Select all</li>
            <li><kbd>Ctrl + Space</kbd> - Select column</li>
            <li><kbd>Shift + Space</kbd> - Select row</li>
            <li><kbd>F2</kbd> - Edit cell</li>
            <li><kbd>Enter</kbd> - Confirm edit or move down</li>
            <li><kbd>Tab</kbd> - Move to next cell</li>
            <li><kbd>Shift + Tab</kbd> - Move to previous cell</li>
          </ul>
        </div>
        <DataEditor
          :width="800"
          :height="400"
          :columns="columns"
          :rows="sampleData.length"
          :get-cell-content="getCellContent"
          :editable="true"
          aria-label="Employee data grid with full keyboard navigation"
          @cell-focused="handleCellFocused"
        />
      </div>
    `,
  }),
};