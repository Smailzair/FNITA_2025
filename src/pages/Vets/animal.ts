export type Animal = {
  id: string;
  nme: string;
  num_ident: string | null;
  num_passport: string | null;
  propr_id: string | null;
  espece: string | null;
  race: string | null;
  sexe: "Mâle" | "Femelle";
  niss_date: Date | null;
  robe: string | null;
  descr: string | null;
  is_radiated: boolean;
  radiat_date: Date | string | null;
  radiat_reason: string | null;
  created_at: Date;
  created_by_email: string | null;
  owner_name?: string | null;
  owner?: { nme: string } | null;
  // QR Code fields
  qr_code_status: "none" | "requested" | "available" | null;
  qr_code_identifier: string | null;
  qr_code_request_date: string | null;
};
