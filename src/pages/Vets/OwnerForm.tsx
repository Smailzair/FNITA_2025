import { useState, type FormEvent } from "react";
import { supabase } from "../../api/supabaseClient";
import WilayaComboBox from "../../components/WilayaComboBox";
import React, { useEffect } from "react";

type Owner = {
  created_at: Date;
  id: string;
  sexe: string;
  fam_nme: string;
  nme: string;
  num_cni: string | null;
  email: string | null;
  tel: string | null;
  wilaya: string | null;
  city: string | null;
  adresse: string | null;
  code_postal: string | null;
  descr: string | null;
};

type OwnerFormProps = {
  owner?: Partial<Owner> | null;
  onSave: (owner: Owner) => void;
  onClose: () => void;
};

export default function OwnerForm({ owner, onSave, onClose }: OwnerFormProps) {
  const [formData, setFormData] = useState<Partial<Omit<Owner, "id">>>({
    sexe: "Homme",
    fam_nme: "",
    nme: "",
    num_cni: "",
    email: "",
    tel: "",
    wilaya: "",
    city: "",
    adresse: "",
    code_postal: "",
    descr: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = owner && owner.id;

  useEffect(() => {
    if (isEditing) {
      setFormData(owner);
    }
  }, [owner, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    let savedOwner: Owner | null = null;

    try {
      if (isEditing) {
        // Update existing owner
        const { id, created_at, ...updateData } = formData as Owner;
        const { data, error: updateError } = await supabase
          .from("tb_props")
          .update(updateData)
          .eq("id", owner.id as string)
          .select()
          .single();
        if (updateError) throw updateError;
        savedOwner = data;
      } else {
        // Create new owner
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const submissionData = { ...formData, created_by_email: user?.email };
        const { data, error: insertError } = await supabase
          .from("tb_props")
          .insert(submissionData)
          .select()
          .single();
        if (insertError) throw insertError;
        savedOwner = data;
      }

      if (savedOwner) {
        onSave(savedOwner);
      } else {
        throw new Error("L'opération a échoué, aucune donnée retournée.");
      }
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-700 p-8 rounded-lg shadow-xl max-w-2xl w-full border border-cyan-500">
      <h2 className="text-white text-2xl font-bold mb-6">
        {isEditing ? "Modifier le Propriétaire" : "Ajouter un Propriétaire"}
      </h2>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <label
              htmlFor="fam_nme"
              className="block text-sm font-medium text-gray-200"
            >
              Nom de famille
            </label>
            <input
              id="fam_nme"
              name="fam_nme"
              value={formData.fam_nme || ""}
              onChange={handleChange}
              placeholder="Nom de famille"
              className="p-1 border rounded w-full text-gray-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="nme"
              className="block text-sm font-medium text-gray-200"
            >
              Prénom
            </label>
            <input
              id="nme"
              name="nme"
              value={formData.nme || ""}
              onChange={handleChange}
              placeholder="Prénom"
              className="p-1 border rounded w-full text-gray-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="sexe"
              className="block text-sm font-medium text-gray-200"
            >
              Sexe
            </label>
            <select
              id="sexe"
              name="sexe"
              value={formData.sexe || ""}
              onChange={handleChange}
              className="p-1 border rounded w-full text-gray-200"
            >
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="num_cni"
              className="block text-sm font-medium text-gray-200"
            >
              N° CNI
            </label>
            <input
              id="num_cni"
              name="num_cni"
              value={formData.num_cni || ""}
              onChange={handleChange}
              placeholder="N° CNI"
              className="p-1 border rounded w-full text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-200"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="Email"
              className="p-1 border rounded w-full text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="tel"
              className="block text-sm font-medium text-gray-200"
            >
              Téléphone
            </label>
            <input
              id="tel"
              name="tel"
              type="tel"
              value={formData.tel || ""}
              onChange={handleChange}
              placeholder="Téléphone"
              className="p-1 border rounded w-full text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Wilaya
            </label>
            <WilayaComboBox
              value={formData.wilaya || ""}
              onChange={(val) => setFormData((p) => ({ ...p, wilaya: val }))}
            />
          </div>
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-200"
            >
              Cité
            </label>
            <input
              id="city"
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
              placeholder="Cité"
              className="p-1 border rounded w-full text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="code_postal"
              className="block text-sm font-medium text-gray-200"
            >
              Code Postal
            </label>
            <input
              id="code_postal"
              name="code_postal"
              value={formData.code_postal || ""}
              onChange={handleChange}
              placeholder="Code Postal"
              className="p-1 border rounded w-full text-gray-900"
            />
          </div>
        </div>
        <label
          htmlFor="adresse"
          className="block text-sm font-medium text-gray-200"
        >
          Adresse
        </label>
        <textarea
          id="adresse"
          name="adresse"
          value={formData.adresse || ""}
          onChange={handleChange}
          placeholder="Adresse"
          className="p-1 border rounded w-full text-gray-900"
        />
        <label
          htmlFor="descr"
          className="block text-sm font-medium text-gray-200"
        >
          Description
        </label>
        <textarea
          id="descr"
          name="descr"
          value={formData.descr || ""}
          onChange={handleChange}
          placeholder="Description"
          className="p-1 border rounded w-full text-gray-900"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-400 rounded hover:bg-gray-500"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
            disabled={isSaving}
          >
            {isSaving
              ? "Enregistrement..."
              : isEditing
                ? "Mettre à jour"
                : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
