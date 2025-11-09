export type Animal = {
  id: string;
  created_at: Date;
  nme: string | null;
  num_ident: string | null;
  num_passport: string | null;
  propr_id: string | null;
  espece: string | null;
  race: string | null;
  sexe: string | null;
  niss_date: Date | null;
  robe: string | null;
  descr: string | null;
  is_radiated: boolean | null;
  radiat_date: string | null;
  radiat_reason: string | null;
  owner_name?: string | null; // From join
};
