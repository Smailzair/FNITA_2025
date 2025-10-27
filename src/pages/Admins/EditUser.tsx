import { useEffect, useState, type FormEvent } from "react";
import PgFooter from "../../components/PgFooter";
import { PgHeader2 } from "../../components/PgHeader2";
import WilayaComboBox from "../../components/WilayaComboBox";
import { sendPasswordResetEmail, supabase } from "../../api/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function EditUser() {
    const [loading, setLoading] = useState(true);
    const [emailLoading, setEmailLoading] = useState(false);
    const { user, role } = useAuth();
    const { userId } = useParams<{ userId?: string }>();

    const [formData, setFormData] = useState({
        fam_nme: "",
        nme: "",
        email: "",
        phone: "",
        adresse: "",
        city: "",
        num_cni: "",
        num_anv: "",
        wilaya: "",
        type: "",
        asking_to_delete: false,
    });

    const [originalEmail, setOriginalEmail] = useState("");
    const [originalType, setOriginalType] = useState("");
    const [isEmailEditing, setIsEmailEditing] = useState(false);
    const [isEmailChangePending, setIsEmailChangePending] = useState(false);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [ActDelMsg, setActDelMsg] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [emailMessage, setEmailMessage] = useState("");

    const [passwordResetState, setPasswordResetState] = useState<{ status: 'idle' | 'loading' | 'sent' | 'error', message: string }>({ status: 'idle', message: '' });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            // On this admin page, userId from the URL is required.
            if (!userId) {
                setError("Aucun ID utilisateur fourni.");
                setLoading(false);
                return;
            }

            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

            if (authError) {
                setError("Utilisateur non trouvé dans l'authentification.");
                setLoading(false);
                return;
            }

            if (authUser.user?.new_email) {
                setIsEmailChangePending(true);
                setPendingEmail(authUser.user.new_email);
            }

            const { data, error: profileError } = await supabase
                .from("tb_login")
                .select("*")
                .eq("id", userId)
                .single();

            if (profileError) {
                setError("Erreur lors de la récupération du profil.");
                setLoading(false);
                return;
            }

            if (data) {
                setFormData({ ...data });
                setOriginalEmail(data.email);
                setOriginalType(data.type);
            }
            setLoading(false);
        };

        fetchUserData();
    }, [userId]);

    useEffect(() => {
        function handleResize() {
            setIsSmallScreen(
                (window.innerHeight <= 455 && window.innerWidth > 490) ||
                (window.innerHeight <= 600 && window.innerWidth <= 500) ||
                (window.innerHeight <= 600 && window.innerWidth <= 338)
            );
        }

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    async function HandleSubmit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setMessage("");
        setActDelMsg("");
        setError("");
        setLoading(true);

        if (!userId) {
            setError("Utilisateur non identifiable pour la mise à jour.");
            setLoading(false);
            return;
        }

        // Admin role change restriction
        if (
            role === "Administrateur" &&
            formData.type !== "Administrateur" &&
            userId === user?.id
        ) {
            const { count, error: countError } = await supabase
                .from("tb_login")
                .select("*", { count: "exact", head: true })
                .eq("type", "Administrateur");

            if (countError || count === 1) {
                setError(
                    "Impossible de changer votre rôle, vous êtes le seul administrateur."
                );
                setLoading(false);
                return;
            }
        }

        const profileUpdates: Partial<typeof formData> = { ...formData };
        delete profileUpdates.email; // Email is handled separately

        // Update profile data in tb_login
        const { error } = await supabase
            .from("tb_login")
            .update(profileUpdates)
            .eq("id", userId);

        if (error) {
            setError(`Erreur de mise à jour du profil: ${error.message}`);
            setLoading(false);
            return;
        }

        setMessage("✅ Informations du profil mises à jour.");
        setLoading(false);
    }

    async function handleEmailUpdate() {
        if (formData.email === originalEmail) {
            setError("L'adresse e-mail n'a pas changé.");
            return;
        }

        // --- Validation Checks ---
        if (!formData.email.trim()) {
            setError("L'adresse e-mail ne peut pas être vide.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Veuillez saisir une adresse e-mail valide.");
            return;
        }
        // --- End Validation ---


        setEmailLoading(true);
        setError("");
        setEmailMessage("");
        setMessage("");
        setActDelMsg("");

        if (!userId) {
            setError("Utilisateur non identifiable pour la mise à jour.");
            setEmailLoading(false);
            return;
        }

        // 0. Check if the new email already exists for another user
        const { data: existingUser, error: existingUserError } = await supabase
            .from("tb_login")
            .select("id")
            .eq("email", formData.email)
            .not("id", "eq", userId) // Exclude the current user
            .single();

        if (existingUser) {
            setError("Cette adresse e-mail est déjà utilisée par un autre compte.");
            setEmailLoading(false);
            return;
        }
        if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 = no rows found, which is good
            setError(`Erreur lors de la vérification de l'e-mail: ${existingUserError.message}`);
            setEmailLoading(false);
            return;
        }

        // 1. Update the email in Supabase Auth using Admin API
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
            email: formData.email,
        });

        if (authError) {
            setError(`Erreur de mise à jour d'email: ${authError.message}`);
            setEmailLoading(false);
            return;
        }

        // NOTE: The email in `tb_login` should be updated by a database trigger
        // that listens for changes in `auth.users`.

        setEmailLoading(false);
        setEmailMessage("L'adresse e-mail a été mise à jour avec succès.");
        setIsEmailEditing(false);
        setOriginalEmail(formData.email); // Update original email to new one
    }

    async function handleCancelEmailChange() {
        setEmailLoading(true);
        setError("");
        setEmailMessage("");

        // Call the custom RPC function to cancel the email change in auth.users
        const { error } = await supabase.rpc('cancel_email_change_for_user', { user_id: userId });

        setEmailLoading(false);

        if (error) {
            setError(`Erreur lors de l'annulation: ${error.message}. Veuillez rafraîchir la page.`);
        } else {
            setIsEmailChangePending(false);
            setPendingEmail(null);
            setEmailMessage("Le changement d'e-mail a été annulé.");
        }
    }

    async function handleAccountDeleteRequest(status: boolean) {
        if (!userId) return;
        setLoading(true);
        const { error } = await supabase
            .from("tb_login")
            .update({ asking_to_delete: status })
            .eq("id", userId);
        setLoading(false);
        if (error) setError(error.message);
        else
            setActDelMsg(
                `Demande de suppression de compte ${status ? "envoyée" : "annulée"}.`
            );
        setFormData((p) => ({ ...p, asking_to_delete: status }));
    }

    function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const { name, value } = target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value, // Use the name attribute to update the correct state field
        }));

        setError("");
        setMessage("");
        setActDelMsg("");
        setEmailMessage("");
        setPasswordResetState({ status: 'idle', message: '' });
    }

    const handleEnableEmailEdit = () => {
        if (window.confirm("Êtes-vous sûr de vouloir modifier l'e-mail de cet utilisateur ?")) {
            setIsEmailEditing(true);
        }
    }

    const handlePasswordReset = async () => {
        setPasswordResetState({ status: 'loading', message: '' });
        const { success, message } = await sendPasswordResetEmail(formData.email);
        if (success) {
            setPasswordResetState({
                status: 'sent',
                message: 'Un lien de réinitialisation a été envoyé à l\'e-mail de l\'utilisateur.',
            });
        } else {
            setPasswordResetState({ status: 'error', message: message });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col w-screen h-screen">
                <PgHeader2 />
                <div className="flex justify-center items-center h-screen">Chargement...</div>

                <PgFooter />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col w-screen h-screen">
                <PgHeader2 />
                <div className="flex flex-col justify-center items-center h-screen text-center gap-4 p-4">
                    <p className="text-red-500 font-semibold text-lg">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Retour
                    </button>
                </div>

                <PgFooter />
            </div>
        )
    }

    return (
        <div className="flex flex-col w-screen h-screen">
            <PgHeader2 />
            <div className="flex flex-col justify-start items-center h-[calc(100vh-7.25rem)] w-full overflow-y-auto py-8">
                <form
                    className="bg-stone-500 flex flex-row flex-wrap items-center justify-center p-2 rounded-lg min-w-80 max-w-2xl"
                    onSubmit={HandleSubmit}
                    autoComplete="on"
                    noValidate
                >
                    {!isSmallScreen && (
                        <>
                            <h1 className="text-2xl font-bold text-slate-300 text-center items-center w-full">
                                Mettre à jour le profil
                            </h1>
                            <div className="border-t-1 border-gray-400 w-[80%] m-2 mb-4" />
                        </>
                    )}

                    <div className="row flex w-full justify-center items-center space-x-3">
                        <div
                            className={`flex flex-col items-center ${role !== "Administrateur" || originalType === "Vétérinaire"
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                                }`}
                            onClick={() =>
                                role === "Administrateur" && originalType !== "Vétérinaire" &&
                                setFormData((p) => ({ ...p, type: "Vétérinaire" }))
                            }
                            title="Médecin Vétérinaire"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="-1 0 19 19"
                                width="27"
                                height="27"
                                fill="currentColor"
                            >
                                <path d="M16.417 9.579A7.917 7.917 0 1 1 8.5 1.662a7.917 7.917 0 0 1 7.917 7.917zm-3.193-.767a1.588 1.588 0 1 0-1.999 1.534v1.515a2.014 2.014 0 0 1-4.027 0v-.334a2.676 2.676 0 0 0 2.262-2.64v-2.14a1.244 1.244 0 0 0-.506-1.002.894.894 0 1 0-.395.754.424.424 0 0 1 .08.248v2.14a1.851 1.851 0 1 1-3.703 0v-2.14a.422.422 0 0 1 .1-.273.895.895 0 1 0-.356-.77 1.245 1.245 0 0 0-.565 1.043v2.14a2.676 2.676 0 0 0 2.262 2.64v.334a2.835 2.835 0 1 0 5.67 0v-1.515a1.59 1.59 0 0 0 1.177-1.534zm-.821 0a.767.767 0 1 1-.767-.767.768.768 0 0 1 .767.767z"></path>
                            </svg>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="Vétérinaire"
                                    checked={formData.type === "Vétérinaire"}
                                    readOnly={true}
                                    disabled={role !== "Administrateur" || originalType === "Vétérinaire"}
                                    className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                Vétérinaire
                            </label>
                        </div>
                        <div className="text-gray-400"> | </div>
                        <div
                            className={`flex flex-col items-center ${role !== "Administrateur" || originalType === "Vétérinaire"
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                                }`}
                            onClick={() =>
                                role === "Administrateur" && originalType !== "Vétérinaire" &&
                                setFormData((p) => ({ ...p, type: "Ayant droit" }))
                            }
                            title="Personne autorisée par le ministère et les administrateurs (Police, Gendarmerie etc...)"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                fill="currentColor"
                            >
                                <path d="M2.91312 11.6739C3.23584 10.1953 3.53865 8.80805 2 6.5L5.5 2.5C5.5 2.5 9 4 12 1.5C15 4 18.5 2.5 18.5 2.5L22 6.5C20.4612 8.8081 20.7641 10.1954 21.0868 11.674C21.3933 13.0781 21.7177 14.5645 20.5 17C19.3425 19.315 17.3478 20.1227 15.4849 20.877C14.1289 21.4261 12.8428 21.9469 12.0003 23C11.1577 21.9469 9.8715 21.4261 8.51549 20.8771C6.65245 20.1227 4.65758 19.315 3.50001 17C2.28218 14.5645 2.60663 13.078 2.91312 11.6739ZM14.3776 12.7725L16.7552 10.4549L13.4694 9.97746L11.9999 7L10.5304 9.97746L7.24463 10.4549L9.62227 12.7725L9.06098 16.0451L11.9999 14.5L14.9388 16.0451L14.3776 12.7725Z"></path>
                            </svg>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="Ayant droit"
                                    checked={formData.type === "Ayant droit"}
                                    readOnly={true}
                                    disabled={role !== "Administrateur" || originalType === "Vétérinaire"}
                                    className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                Ayant droit
                            </label>
                        </div>
                        <div className="text-gray-400"> | </div>
                        <div
                            className={`flex flex-col items-center ${role !== "Administrateur" || originalType === "Vétérinaire"
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                                }`}
                            onClick={() =>
                                role === "Administrateur" && originalType !== "Vétérinaire" &&
                                setFormData((p) => ({ ...p, type: "Administrateur" }))
                            }
                            title="Ministre et administrateur du site"
                        >
                            <svg
                                fill="currentColor"
                                width="28"
                                height="28"
                                viewBox="-1 0 19 19"
                                xmlns="http://www.w3.org/2000/svg"
                                className="cf-icon-svg"
                            >
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g
                                    id="SVGRepo_tracerCarrier"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke="#CCCCCC"
                                    stroke-width="0.266"
                                ></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path d="M16.417 9.579A7.917 7.917 0 1 1 8.5 1.662a7.917 7.917 0 0 1 7.917 7.917zm-2.853 3.368a.318.318 0 0 0-.316-.316h-.334v-.394a.318.318 0 0 0-.316-.317H12.3V9.25h.214a.396.396 0 0 0 0-.79H4.457a.396.396 0 0 0 0 .79h.226v2.67H4.35a.318.318 0 0 0-.317.317v.394H3.7a.318.318 0 0 0-.317.316v.394h10.182zm-8.88-5.144H12.3a3.808 3.808 0 0 0-7.617 0zM6.35 9.67v2.25h-.79V9.67a.396.396 0 0 1 .791 0zm1.686.006v2.244h-.791V9.676a.396.396 0 0 1 .791 0zm1.686.007v2.237h-.791V9.683a.396.396 0 0 1 .791 0zm1.686.006v2.231h-.792V9.69a.396.396 0 0 1 .792 0z"></path>
                                </g>
                            </svg>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="Administrateur"
                                    checked={formData.type === "Administrateur"}
                                    readOnly={true}
                                    disabled={role !== "Administrateur" || originalType === "Vétérinaire"}
                                    className="mr-1 h-4 w-4 text-teal-600 bg-gray-100 border-gray-300 focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                Administrateur
                            </label>
                        </div>
                    </div>
                    {role !== "Administrateur" ? (
                        <p className="text-xs text-gray-300 mt-2 w-full text-center">
                            Seul un administrateur peut modifier le type de compte.
                        </p>
                    ) : (
                        originalType === "Vétérinaire" && (
                            <p className="text-xs text-yellow-300 mt-2 w-full text-center">
                                Le rôle d'un vétérinaire ne peut pas être modifié pour préserver l'intégrité de ses données.
                            </p>
                        )
                    )}
                    <div className="border-t-0 border-2 border-gray-400 w-full m-2"></div>

                    {/* --------------------------Proprietaire -------------------------- */}
                    <div className="flex flex-wrap justify-center items-start">
                        <label
                            className="flex text-orange-200 w-72 items-center justify-end"
                            title="Nom du famille"
                        >
                            Nom :
                            <input
                                className="m-1 rounded-md text-black pl-1 w-45 !border-orange-200"
                                type="text"
                                name="fam_nme"
                                placeholder="Nom"
                                autoComplete="family-name"
                                value={formData.fam_nme}
                                required={true}
                                onChange={handleFormChange}
                            />
                        </label>
                        <label
                            className="flex text-orange-200 w-72 items-center justify-end"
                            title="Prénom"
                        >
                            Prénom :
                            <input
                                className="m-1 rounded-md text-black pl-1 w-45 !border-orange-200"
                                type="text"
                                name="nme"
                                placeholder="Prénom"
                                // standard token for given/first name
                                autoComplete="given-name"
                                value={formData.nme}
                                onChange={handleFormChange}
                                required={true}
                            />
                        </label>
                        <label
                            className={`flex ${formData.type === "Vétérinaire" ? "text-orange-200" : ""
                                } w-72 items-center justify-end`}
                            title="Numéro de téléphone"
                        >
                            N° Tél :
                            <input
                                className={`m-1 rounded-md text-black pl-1 w-45  ${formData.type === "Vétérinaire" ? "!border-orange-200" : ""
                                    }`}
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="N° Tél"
                                value={formData.phone}
                                onChange={handleFormChange}
                                required={formData.type === "Vétérinaire"}
                            />
                        </label>
                        <label
                            className="flex w-72 items-center justify-end"
                            title="Numéro de la carte nationale d'identité"
                        >
                            N° CNI :
                            <input
                                className="m-1 rounded-md text-black pl-1 w-45"
                                type="text"
                                name="num_cni"
                                value={formData.num_cni}
                                onChange={handleFormChange}
                                placeholder="N° Carte Nationale d'Identité"
                            />
                        </label>
                        {formData.type === "Vétérinaire" && (
                            <label
                                className={"flex  w-72 items-center justify-end"}
                                title="Code de l'Autorité Vétérinaire Nationale"
                            >
                                ANV :
                                <input
                                    className="m-1 rounded-md text-black pl-1 w-45 "
                                    type="text"
                                    name="num_anv"
                                    value={formData.num_anv}
                                    onChange={handleFormChange}
                                    placeholder="Code Autorité Vétérinaire Nationale"
                                />
                            </label>
                        )}
                        <label className="flex w-72 items-center justify-end cl">
                            Wilaya :
                            <WilayaComboBox
                                value={formData.wilaya ?? ""}
                                onChange={(val) => setFormData((p) => ({ ...p, wilaya: val }))}
                            />
                        </label>
                        <label className="flex w-72 items-center justify-end">
                            Cité :
                            <input
                                className="m-1 rounded-md text-black pl-1 w-45"
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleFormChange}
                                placeholder="Cité"
                            />
                        </label>
                        <label className="flex w-72 items-start justify-end">
                            <span className="mt-1">Adresse :</span>
                            <textarea
                                name="adresse"
                                className="m-1 rounded-md text-black pl-1 w-45 h-15"
                                placeholder="Adresse"
                                value={formData.adresse}
                                onChange={handleFormChange}
                            />
                        </label>
                    </div>
                    {/* --- Main Profile Save Button --- */}

                    <div className="row w-full flex justify-center items-center gap-4">
                        <button
                            type="submit"
                            className="bg-green-700 text-md border-1 outline-white outline-none hover:outline-black hover:text-black rounded-full p-1.5 m-2 w-52"
                            disabled={loading}
                        >
                            {loading ? "Enregistrement..." : "Enregistrer les informations"}
                        </button>

                        {error && <p className="text-red-400 font-semibold">{error}</p>}
                        {message && (
                            <p className="text-green-300 font-semibold max-w-xs text-center">
                                {message}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end w-full items-center ml-3 mt-0" title="Les champs marqués sont obligatoires">
                        <label className="w-fit text-xs h-4  border text-transparent border-orange-200 rounded-lg mr-1 justify-center items-center">
                            ***
                        </label>
                        <label className="text-orange-200 w-fit text-xs justify-center items-center">
                            Champs obligés
                        </label>
                    </div>
                    <div className="border-t-2 border-gray-400 w-full m-2"></div>
                    {/* --- Email and Password Section --- */}
                    <div
                        className="flex flex-wrap justify-center w-full"
                        onKeyDown={(e) => { if (e.key === 'Enter' && isEmailEditing) { e.preventDefault(); handleEmailUpdate(); } }}
                    >
                        <div className="flex flex-col items-center justify-center w-full max-w-md px-4">
                            {isEmailChangePending ? (
                                <div className="text-center bg-yellow-200 text-yellow-800 p-3 rounded-lg w-full flex flex-col items-center">
                                    <p className="font-semibold">Confirmation en attente</p>
                                    <p className="text-sm">
                                        L'utilisateur doit confirmer sa nouvelle adresse e-mail : <br />
                                        <strong className="break-all">{pendingEmail}</strong>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleCancelEmailChange}
                                        className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded-lg disabled:opacity-50"
                                        disabled={emailLoading}
                                    >
                                        {emailLoading ? 'Annulation...' : 'Annuler le changement'}
                                    </button>
                                </div>
                            ) : (
                                <label className="flex text-orange-200 w-full items-center justify-between mb-2">
                                    Email :
                                    <div className="flex items-center">
                                        <input
                                            className="m-1 rounded-md text-black pl-1 w-45 !border-orange-200 disabled:bg-gray-300 disabled:text-gray-500"
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            required={true}
                                            onChange={handleFormChange}
                                            disabled={!isEmailEditing}
                                        />
                                        <button
                                            type="button"
                                            onClick={isEmailEditing ? handleEmailUpdate : handleEnableEmailEdit}
                                            className={`text-white px-2 py-1 rounded-md text-xs ml-2 ${isEmailEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-500 hover:bg-blue-600'}`} disabled={emailLoading}>
                                            {emailLoading ? '...' : (isEmailEditing ? 'Enregistrer' : 'Modifier')}
                                        </button>
                                    </div>
                                </label>
                            )}

                            {isEmailEditing && !isEmailChangePending && (
                                <p className="text-yellow-300 text-xs w-full text-center mb-4">
                                    La modification de l'e-mail est immédiate pour l'administrateur.
                                </p>
                            )}
                            {emailMessage && (
                                <p className="text-green-300 font-semibold text-center mt-2">{emailMessage}</p>
                            )}
                            {error && isEmailEditing && (
                                <p className="text-red-400 font-semibold text-center mt-2">{error}</p>
                            )}
                            <div className="flex flex-row justify-center items-center w-full gap-4">
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    className={`bg-stone-700 text-white font-bold py-2 px-4 rounded-2xl hover:bg-stone-800 w-60 mt-2 disabled:bg-stone-500 disabled:cursor-not-allowed`}
                                    title="Changer le mot de passe"
                                    disabled={passwordResetState.status === 'loading' || passwordResetState.status === 'sent'}
                                >
                                    {passwordResetState.status === 'loading' ? 'Envoi en cours...' : 'Changer le mot de passe'}
                                </button>
                                {passwordResetState.status !== 'idle' && (
                                    <p className={`text-center text-xs max-w-xs ${passwordResetState.status === 'error' ? 'text-red-400' : 'text-yellow-300'}`}>
                                        {passwordResetState.message}
                                    </p>
                                )}
                            </div>

                        </div>
                    </div>
                    <div className="border-t-2 border-gray-400 w-full m-2"></div>
                    <div className="flex w-full justify-center items-center gap-4 p-2">
                        {formData.asking_to_delete ? (
                            <button
                                type="button"
                                onClick={() => handleAccountDeleteRequest(false)}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-2xl"
                            >
                                Annuler la demande de suppression
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleAccountDeleteRequest(true)}
                                className="bg-red-400 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl"
                                title="Attenton, cette action est irréversible et supprimera votre compte permanentement."
                            >
                                Demander la suppression du compte
                            </button>
                        )}
                        {ActDelMsg && (
                            <p className="text-green-300 font-semibold max-w-xs text-center">
                                {ActDelMsg}
                            </p>
                        )}
                    </div>

                </form>

            </div>
            <PgFooter />
        </div>
    );
}