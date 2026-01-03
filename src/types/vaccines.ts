export type MovementType =
  | "receive"
  | "distribute"
  | "adjust"
  | "transfer"
  | "waste";

export interface Vaccine {
  id: string;
  name: string;
  code?: string;
  manufacturer?: string;
  doses_per_vial?: number;
  created_at?: string;
}

export interface VaccineBatch {
  id: string;
  vaccine_id: string;
  batch_no: string;
  manufacture_date?: string;
  expiry_date?: string;
  received_quantity: number;
  remaining_quantity: number;
  created_at?: string;
}

export interface Inventory {
  id: string;
  wilaya: string;
  vaccine_id: string;
  quantity: number;
  last_updated?: string;
}

export interface StockMovement {
  id: string;
  movement_type: MovementType;
  date?: string;
  wilaya?: string;
  to_wilaya?: string;
  vaccine_id?: string;
  batch_id?: string;
  quantity: number;
  performed_by?: string;
  note?: string;
  created_at?: string;
}
