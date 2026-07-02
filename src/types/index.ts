export type ApiResponse<T = unknown> = {
  status: 'success' | 'error'
  message: string
  data?: T
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type Supplier = {
  id: string
  name: string
  contact_name: string
  phone: string
  email: string
  address: string
  created_at: string
  updated_at: string
}

export type InventoryItem = {
  id: string
  sku: string
  name: string
  description: string
  unit: string
  quantity_in_stock: number
  min_quantity: number
  cost_per_unit: number
  created_at: string
  updated_at: string
}

export type StockTransaction = {
  id: string
  inventory_item_id: string
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_REMOVE'
  quantity: number
  quantity_before: number
  quantity_after: number
  reference_type: string
  reference_id: string
  note: string
  created_at: string
}

export type BOMItem = {
  id: string
  product_id: string
  inventory_item_id: string
  quantity_required: number
  inventory_item?: InventoryItem
}

export type Product = {
  id: string
  pos_product_id: string
  name: string
  sku: string
  barcode: string
  is_active: boolean
  bom?: BOMItem[]
  created_at: string
  updated_at: string
}

export type PurchaseOrderItem = {
  id: string
  purchase_order_id: string
  inventory_item_id: string
  quantity_ordered: number
  quantity_received: number
  cost_per_unit: number
  inventory_item?: InventoryItem
}

export type PurchaseOrder = {
  id: string
  po_number: string
  supplier_id: string
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  ordered_at: string | null
  expected_at: string | null
  received_at: string | null
  notes: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
  created_at: string
  updated_at: string
}

export type Webhook = {
  id: string
  name: string
  url: string
  events: ('STOCK_UPDATED' | 'STOCK_LOW' | 'STOCK_OUT')[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WebhookLog = {
  id: string
  webhook_subscription_id: string
  event: string
  status_code: number
  success: boolean
  attempted_at: string
}

export type StockLevel = {
  inventory_item_id: string
  sku: string
  name: string
  unit: string
  quantity_in_stock: number
  min_quantity: number
  unit_cost: number
  is_low: boolean
  is_out: boolean
}

export type AvailabilityResult = {
  pos_product_id: string
  name: string
  is_available: boolean
  details: {
    inventory_item_id: string
    sku: string
    name: string
    required: number
    available: number
    unit_cost: number
    is_sufficient: boolean
  }[]
}

export type StockDeduction = {
  inventory_item_id: string
  sku: string
  name: string
  quantity_deducted: number
  quantity_remaining: number
}

export type CostBreakdownItem = {
  pos_product_id: string
  unit_cost: number
  total_cost: number
}

export type DeductStockResult = {
  pos_order_id: string
  status: 'processed' | 'already_processed'
  deductions: StockDeduction[]
  cost_breakdown?: CostBreakdownItem[]
}
