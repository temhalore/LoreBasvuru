# DataTable Component

Evrensel ve güçlü bir DataTable component'i. Her türlü proje için kullanılabilir.

## Özellikler

### ✅ Temel Özellikler
- **Responsive tasarım** - Mobil ve desktop uyumlu
- **Fuse teması uyumu** - Mevcut tasarım sistemi ile uyumlu
- **TypeScript desteği** - Tip güvenliği
- **Standalone component** - Angular 17+ standalone yapı

### ✅ Veri Yönetimi
- **API entegrasyonu** - REST API'lerle otomatik çalışma
- **Statik veri desteği** - Local array'lerle çalışma
- **Otomatik sayfalandırma** - Backend ile senkronize
- **Akıllı filtreleme** - Client/Server side filtering

### ✅ Kullanıcı Deneyimi
- **Gelişmiş arama** - Tüm kolonlarda arama
- **Çoklu filtreleme** - Dropdown, multiselect, text filtreler
- **Kolon sıralama** - Asc/Desc sıralama
- **Satır seçimi** - Tekli/çoklu seçim
- **Sticky header** - Sabit başlık
- **Loading states** - Yükleme göstergeleri

### ✅ Özelleştirme
- **Custom template'ler** - Özel hücre tasarımları
- **Aksiyon butonları** - Satır bazlı işlemler
- **Flexible kolonlar** - Farklı veri tipleri
- **Badge sistemi** - Status göstergeleri
- **Export özelliği** - Veri dışa aktarımı

## Kullanım

### Basit Kullanım

```typescript
import { DataTableComponent, DataTableConfig } from './shared/components/data-table';

@Component({
  imports: [DataTableComponent]
})
export class MyComponent {
  tableConfig: DataTableConfig = {
    data: [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 }
    ],
    columns: [
      { key: 'name', label: 'Product Name', sortable: true },
      { key: 'price', label: 'Price', type: 'currency', sortable: true }
    ],
    pagination: { enabled: true, pageSize: 10 },
    searchable: true
  };
}
```

```html
<app-data-table [config]="tableConfig"></app-data-table>
```

### API ile Kullanım

```typescript
tableConfig: DataTableConfig = {
  apiUrl: '/api/products',
  columns: [
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'price', label: 'Price', type: 'currency' }
  ],
  pagination: { enabled: true, pageSize: 20 },
  sorting: { enabled: true, defaultSort: { column: 'name', direction: 'asc' } },
  searchable: true
};
```

## Kolon Tipleri

```typescript
// Text kolonu
{ key: 'name', label: 'Name', type: 'text', sortable: true }

// Para birimi
{ key: 'price', label: 'Price', type: 'currency', align: 'right' }

// Tarih
{ key: 'createdAt', label: 'Created', type: 'date', format: 'shortDate' }

// Boolean (checkmark/x)
{ key: 'active', label: 'Active', type: 'boolean', align: 'center' }

// Resim
{ key: 'thumbnail', label: 'Image', type: 'image', width: '80px' }

// Badge/Status
{ key: 'status', label: 'Status', type: 'badge' }

// Aksiyon butonları
{ key: 'actions', label: 'Actions', type: 'actions', sticky: 'end' }

// Custom template
{ key: 'custom', label: 'Custom', template: myTemplate }
```

## Filtreler

```typescript
filters: [
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing' }
    ]
  },
  {
    key: 'brand',
    label: 'Brand',
    type: 'multiselect',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'samsung', label: 'Samsung' }
    ]
  },
  {
    key: 'name',
    label: 'Product Name',
    type: 'text',
    placeholder: 'Search by name...'
  }
]
```

## Aksiyon Butonları

```typescript
actions: [
  {
    label: 'Edit',
    icon: 'heroicons_outline:pencil',
    color: 'primary',
    action: (row) => this.editItem(row)
  },
  {
    label: 'Delete',
    icon: 'heroicons_outline:trash',
    color: 'warn',
    action: (row) => this.deleteItem(row),
    visible: (row) => row.canDelete,
    disabled: (row) => row.isProcessing
  }
]
```

## Custom Template

```html
<ng-template #customTemplate let-row="$implicit" let-column="column">
  <div class="flex items-center gap-2">
    <img [src]="row.avatar" class="w-8 h-8 rounded-full" />
    <span>{{ row.fullName }}</span>
  </div>
</ng-template>
```

```typescript
columns: [
  {
    key: 'user',
    label: 'User',
    template: this.customTemplate
  }
]
```

## Event'ler

```html
<app-data-table 
  [config]="tableConfig"
  (rowClick)="onRowClick($event)"
  (rowSelect)="onRowSelect($event)"
  (stateChange)="onStateChange($event)">
</app-data-table>
```

```typescript
onRowClick(row: any): void {
  console.log('Clicked row:', row);
}

onRowSelect(selectedRows: any[]): void {
  console.log('Selected rows:', selectedRows);
}

onStateChange(state: DataTableState): void {
  console.log('Table state changed:', state);
}
```

## API Beklenen Format

### Request Parameters
```
GET /api/products?page=1&pageSize=10&search=phone&sortBy=name&sortDirection=asc&category=electronics
```

### Response Format
```json
{
  "data": [
    { "id": 1, "name": "iPhone", "price": 999 },
    { "id": 2, "name": "Samsung", "price": 799 }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 10
}
```

## Styling

Component Fuse teması ile uyumlu olarak tasarlanmıştır. Özel stillendirme için:

```scss
.data-table-container {
  .custom-cell {
    background-color: var(--fuse-primary);
  }
}
```

## Browser Desteği

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Lisans

MIT
