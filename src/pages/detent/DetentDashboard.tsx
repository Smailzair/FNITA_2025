import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabaseClient";
import PgFooter from "../../components/PgFooter";
import DashboardButton from "../../components/DashboardButton";
import html2canvas from "html2canvas";

export default function DetentDashboard() {
  const navigate = useNavigate();
  const [animalData, setAnimalData] = useState<any>(null);
  const [VeterinaryData, setVeterinaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [PropFullNme, setPropFullNme] = useState("");
  const [lostDeclaration, setLostDeclaration] = useState<any>(null);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [declarationDate, setDeclarationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [declarationDesc, setDeclarationDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const animalId = sessionStorage.getItem("detent_animal_id");
    const lastActive = sessionStorage.getItem("detent_last_active");
    const now = Date.now();
    const MAX_INACTIVITY = 15 * 60 * 1000; // 15 minutes

    if (
      !animalId ||
      !lastActive ||
      now - parseInt(lastActive) > MAX_INACTIVITY
    ) {
      sessionStorage.removeItem("detent_animal_id");
      sessionStorage.removeItem("detent_last_active");
      navigate("/detent/login");
      return;
    }

    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("tb_animals")
          .select(
            `
            *,
            tb_props (
              fam_nme,
nme,
adresse,
city,
wilaya,
code_postal,
tel,
email           
            )
          `
          )
          .eq("num_ident", animalId)
          .single();

        if (error) throw error;
        if (data) {
          setAnimalData(data);
          setPropFullNme(`${data.tb_props?.fam_nme} ${data.tb_props?.nme}`);

          // Check for active lost declaration
          const { data: lostDataRes } = await supabase
            .from("tb_lost_animals")
            .select("*")
            .eq("animal_id", data.id)
            .eq("is_found", false)
            .order("lost_date", { ascending: false })
            .limit(1);
          const lostData = lostDataRes?.[0];

          if (lostData) {
            let declarer = "Inconnu";
            if (lostData.created_by_user_id) {
              const { data: uData } = await supabase
                .from("tb_login")
                .select("fam_nme, nme, type")
                .eq("id", lostData.created_by_user_id)
                .maybeSingle();
              if (uData) {
                declarer = `${uData.fam_nme} ${uData.nme} (${uData.type})`;
              }
            } else if (lostData.created_by_prop_id) {
              declarer = "Propriétaire (Vous)";
            }
            setLostDeclaration({ ...lostData, declarer });
          } else {
            setLostDeclaration(null);
          }

          //----------------
          const { data: vetData } = await supabase
            .from("tb_login")
            .select(
              `email,
fam_nme,
nme,
phone,
num_cni,
num_anv,
type,
wilaya,
city,
adresse`
            )
            .eq("email", data.created_by_email)
            .maybeSingle();

          if (vetData) {
            setVeterinaryData(vetData);
          }
        }
      } catch (err: any) {
        console.error("Error fetching animal data:", err);
        setErrorMsg("Impossible de charger les informations de l'animal.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, refreshTrigger]);

  const handleLogout = () => {
    sessionStorage.removeItem("detent_animal_id");
    sessionStorage.removeItem("detent_last_active");
    navigate("/detent/login");
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      sessionStorage.setItem("detent_last_active", Date.now().toString());
      if (timer) clearTimeout(timer);
      timer = setTimeout(
        () => {
          sessionStorage.removeItem("detent_animal_id");
          sessionStorage.removeItem("detent_last_active");
          navigate("/detent/login");
        },
        15 * 60 * 1000
      ); // 15 minutes
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer, true));

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer, true)
      );
    };
  }, [navigate]);

  const handleGenerateCertificate = async () => {
    const certificateHTML = `
    <div id="certificate-to-export" style="position: absolute; left: -9999px; width: 210mm; min-height: 297mm; background: white; padding: 10mm; font-family: Arial, sans-serif; font-size: 10pt; box-sizing: border-box; display: flex; flex-direction: column;">
      <div style="flex-grow: 1;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5mm;">
            <div style="width: 50%; padding-right: 5mm; color: #000;">
                <p style="font-size: 8pt; margin-bottom: 1mm; color: #000;">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
                <p style="font-size: 10pt; font-weight: bold; margin: 0; color: #000;">MINISTÈRE DE L'AGRICULTURE ET DU DÉVELOPPEMENT RURAL</p>
                <p style="font-size: 8pt; margin-top: 2mm; color: #000;">FICHIER NATIONAL D'IDENTIFICATION ET DE TRAÇABILITÉ ANIMALE (FNITA)</p>
            </div>

            <div style="width: 45%; text-align: right; color: #000;">
                <div style="border: 2px solid #0D9488; padding: 1mm 3mm; background-color: #F0FDFA; display: inline-block;">
                    <span style="font-size: 16pt; font-weight: bold; color: #0D9488;">FNITA</span>
                </div>
                <p style="font-size: 8pt; margin-top: 1mm; color: #000;">SOCIÉTÉ D'IDENTIFICATION DES CARNIVORES DOMESTIQUES</p>
                <div style="margin-top: 2mm; background-color: #f0f0f0; padding: 2mm; border: 1px solid #ccc; color: #000;">
                    <strong style="font-size: 12pt;">BARCODE:</strong> <span style="font-family: monospace;">${animalData.num_ident || "--"}</span>
                </div>
            </div>
        </div>

        <div style="border: 1px solid #ccc; margin-bottom: 5mm;">
            <div style="background-color: #0D9488; color: black; padding: 2mm 5mm; font-size: 12pt; font-weight: bold; display: flex; align-items: center;">
                DÉTENTEUR
            </div>
            <div style="padding: 3mm 5mm; color: #000;">
                <p style="margin: 1mm 0; color: #000;"><strong>MME/M. ${`${animalData.tb_props?.fam_nme || ""} ${animalData.tb_props?.nme || ""}`.trim()}</strong></p>
                <p style="margin: 1mm 0; color: #000;">${[animalData.tb_props?.adresse, animalData.tb_props?.city].filter(Boolean).join(", ") || "Adresse non spécifiée"}</p>
                <p style="margin: 1mm 0; color: #000;"><strong>Wilaya/Province:</strong> ${animalData.tb_props?.wilaya || "--"} - <strong>CP:</strong> ${animalData.tb_props?.code_postal || "--"}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 3mm; border-top: 1px dotted #ccc; padding-top: 2mm;">
                    <p style="margin: 1mm 0; color: #000;"><strong>TEL 1:</strong> ${animalData.tb_props?.tel || "--"}</p>
                    <p style="margin: 1mm 0; color: #000;"><strong>E-MAIL:</strong> ${animalData.tb_props?.email || "--"}</p>
                </div>
            </div>
        </div>

        <div style="border: 1px solid #ccc; margin-bottom: 5mm;">
            <div style="background-color: #0D9488; color: black; padding: 2mm 5mm; font-size: 12pt; font-weight: bold;">
                IDENTIFICATION DE L'ANIMAL
            </div>
            <div style="padding: 3mm 5mm; color: #000;">
                <div style="background-color: #F0FDFA; padding: 2mm; margin-bottom: 3mm;">
                    <strong style="color: #0D9488;">N° IDENTIFICATION (PUCE):</strong> <span style="font-family: monospace; font-size: 12pt;">${animalData.num_ident || "--"}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <div style="width: 48%;">
                        <p style="margin: 1mm 0; color: #000;"><strong>DATE D'INSCREPTION:</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>EMPLACEMENT:</strong> --</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>VÉTÉRINAIRE:</strong> ${VeterinaryData ? `${VeterinaryData?.fam_nme}${" "}${VeterinaryData?.nme || `${animalData?.created_by_email || "--"}`}` : "--"}</p>
                    </div>
                    <div style="width: 48%;">
                        <p style="margin: 1mm 0; color: #000;"><strong>TATOOAGE:</strong> --</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>DATE:</strong> --</p>
                        <p style="margin: 1mm 0; color: #000;"><strong>MOT DE PASSE:</strong> ${animalData.password || "--"}</p>
                    </div>
                </div>
            </div>
        </div>

        <div style="border: 1px solid #ccc; margin-bottom: 5mm;">
            <div style="background-color: #0D9488; color: black; padding: 2mm 5mm; font-size: 12pt; font-weight: bold;">
                DESCRIPTION DE L'ANIMAL
            </div>
            <div style="padding: 3mm 5mm; color: #000;">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>ESPÈCE:</strong> ${animalData.espece || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>SEXE:</strong> ${animalData.sexe || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>STÉRILISÉ:</strong> --</p>

                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>DATE DE NAISSANCE:</strong> ${animalData.niss_date ? new Date(animalData.niss_date).toLocaleDateString("fr-FR") : "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>RACE:</strong> ${animalData.race || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>PAYS D'ORIGINE:</strong> ALGÉRIE</p>

                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>ROBE:</strong> ${animalData.robe || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>NOM D'USAGE:</strong> ${animalData.nme || "--"}</p>
                    <p style="width: 30%; margin: 1mm 0; color: #000;"><strong>CATÉGORIE:</strong> --</p>
                </div>
            </div>
        </div>

        <div style="margin-top: 5mm; font-size: 8pt; color: #555;">
            <p>Ce document atteste de l'enregistrement de l'animal dans le Fichier National d'Identification et de Traçabilité Animale (FNITA).</p>
            <p>Toute modification des informations (changement d'adresse, de détenteur, décès) doit être signalée au FNITA.</p>
        </div>
      </div>

      <div style="border: 2px solid #0f766e; margin-top: 10mm;">
          <div style="background-color: #0f766e; color: black; padding: 2mm 5mm; font-size: 10pt; font-weight: bold; text-align: center;">
              PARTIE BASSE DE LA CARTE D'IDENTIFICATION À DÉTACHER ET À CONSERVER AVEC VOUS
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
              <thead>
                  <tr style="background-color: #f0f0f0;">
                      <th style="border: 1px solid #ccc; padding: 2mm; width: 40%; text-align: left; background-color: #ccfbf1; color: #000;">ANIMAL</th>
                      <th style="border: 1px solid #ccc; padding: 2mm; width: 60%; text-align: left; background-color: #ccfbf1; color: #000;">DÉTENTEUR</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td style="border: 1px solid #ccc; padding: 2mm; vertical-align: top; color: #000;">
                          <strong>IDENTIFICATION:</strong> <span style="font-family: monospace;">${animalData.num_ident || "--"}</span><br>
                          <strong>NOM:</strong> ${animalData.nme || "--"}<br>
                          <strong>NÉ(E) LE:</strong> ${animalData.niss_date ? new Date(animalData.niss_date).toLocaleDateString("fr-FR") : "--"}<br>
                          <strong>RACE:</strong> ${animalData.race || "--"}<br>
                          <strong>ROBE:</strong> ${animalData.robe || "--"}
                      </td>
                      <td style="border: 1px solid #ccc; padding: 2mm; vertical-align: top; color: #000;">
                          <strong>MME/M. ${`${animalData.tb_props?.fam_nme || ""} ${animalData.tb_props?.nme || ""}`.trim()}</strong><br>
                          ${[animalData.tb_props?.adresse, animalData.tb_props?.city].filter(Boolean).join(", ") || "Adresse non spécifiée"}<br>
                          ${animalData.tb_props?.wilaya || "--"} - <strong>CP:</strong> ${animalData.tb_props?.code_postal || "--"}<br>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
    </div>
    `;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = certificateHTML;
    document.body.appendChild(tempDiv);

    const certificateElement = document.getElementById("certificate-to-export");
    if (!certificateElement) {
      document.body.removeChild(tempDiv);
      return;
    }

    const canvas = await html2canvas(certificateElement, {
      scale: 3, // Increased scale for better quality
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    let height = pdfWidth / ratio;

    if (height > pdfHeight) {
      height = pdfHeight; // Scale to fit page height if it's too long
    }

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, height);
    pdf.save(`certificat-${animalData.num_ident || "animal"}.pdf`);

    document.body.removeChild(tempDiv);
  };

  const handleLostSubmit = async () => {
    if (!animalData) return;
    setIsSubmitting(true);
    try {
      // Check if an active declaration already exists to prevent duplicates
      const { data: existing } = await supabase
        .from("tb_lost_animals")
        .select("id")
        .eq("animal_id", animalData.id)
        .eq("is_found", false)
        .maybeSingle();

      if (existing) {
        throw new Error("Une déclaration de perte est déjà active pour cet animal.");
      }

      const { error } = await supabase.from("tb_lost_animals").insert({
        animal_id: animalData.id,
        lost_date: declarationDate,
        descr: declarationDesc,
        created_by_prop_id: animalData.propr_id,
        is_found: false,
      });
      if (error) throw error;
      setShowLostModal(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFoundSubmit = async () => {
    if (!lostDeclaration) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("tb_lost_animals")
        .update({
          is_found: true,
          found_date: declarationDate,
          found_declar_by_prop_id: animalData.propr_id,
        })
        .eq("id", lostDeclaration.id);
      if (error) throw error;
      setShowFoundModal(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-gray-50">
      <nav className="bg-teal-900 z-0">
        <div className="mx-auto max-sm:ml-0 max-md:ml-2 ml-8 ">
          <div className="relative flex h-20 items-center justify-between">
            <div className="flex grow items-center justify-center sm:justify-star">
              <div className="items-center min-w-fit ml-1">
                <Link to={"/detent/dashboard"}>
                  <img
                    src="/LOGO_ALG.png"
                    alt="LOGO_ALG"
                    width={360}
                    height={360}
                    className="h-16 w-16 min-w-full"
                  />
                </Link>
              </div>
              {/* <p className="whitespace-nowrap text-center text-gray-50 font-bold text-xl max-sm:hidden pl-8 min-w-fit">
                Espace détenteur
              </p> */}
              <div className="flex flex-auto items-center justify-center sm:block ml-1 mr-1">
                <p className="whitespace-nowrap text-center text-gray-50 text-sm max-sm:text-xs pl-0 min-w-fit">
                  République algérienne démocratique et populaire
                  <br />
                  Ministère de l&apos;Agriculture et du Développement Rural
                  <br />
                  Fichier National d&apos;Identification et Traçabilité Animale
                </p>
              </div>
              <div className="inset-y-0 right-0 flex flex-col items-center pr-2 max-xs:hidden min-w-fit text-xs w-fit h-full justify-center">
                <label className="text-gray-200 text-center mb-0 text-sm">
                  {PropFullNme}
                </label>
                <label className="text-gray-400 text-center mb-1">
                  - Détenteur -
                </label>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-1 py-1 rounded-md text-sm font-light transition shadow-sm"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main
        className="flex-1 p-4 md:p-8 overflow-y-auto pb-16"
        style={{
          backgroundImage: "url(/PagesBg/002.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Semi-transparent white overlay */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <div className="max-w-7xl mx-auto">

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Gestion de mon Animal
            </h1>
            <h1 className="text-gray-500 mb-8">
              Bienvenue dans votre espace détenteur, {PropFullNme}!
            </h1>
            <p className="text-gray-600 mb-8">
              Effectuez des déclarations ou gérez les documents officiels de
              votre animal.
            </p>

            {/* Loading & Error Feedback */}
            {loading && (
              <div className="text-center py-8 text-gray-600">
                Chargement des informations de l'animal...
              </div>
            )}
            {errorMsg && (
              <div className="text-center py-8 text-red-600">{errorMsg}</div>
            )}

            {/* Lost Declaration Warning */}
            {!loading && lostDeclaration && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-8 rounded shadow-sm">
                <div className="flex">
                  <div className="shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-orange-800">
                      Animal déclaré perdu
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p><span className="font-bold">Date de la perte :</span> {new Date(lostDeclaration.lost_date).toLocaleDateString("fr-FR")}</p>
                      <p><span className="font-bold">Déclaré par :</span> {lostDeclaration.declarer}</p>
                      {lostDeclaration.descr && <p><span className="font-bold">Description :</span> {lostDeclaration.descr}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Animal Situation Status */}
            {!loading && animalData && animalData.is_radiated && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded shadow-sm">
                <div className="flex">
                  <div className="shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">
                      Situation de l'animal
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        <span className="font-bold">Statut :</span> Radié
                      </p>
                      <p>
                        <span className="font-bold">Motif :</span>{" "}
                        {animalData.radiat_reason || "Non spécifié"}
                      </p>
                      <p>
                        <span className="font-bold">Date :</span>{" "}
                        {animalData.radiat_date
                          ? new Date(animalData.radiat_date).toLocaleDateString(
                            "fr-FR"
                          )
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-8 justify-center md:justify-start mb-12">
              <div className={lostDeclaration || (animalData && animalData.is_radiated) ? "opacity-50 pointer-events-none grayscale" : ""}>
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    setDeclarationDate(new Date().toISOString().split("T")[0]);
                    setDeclarationDesc("");
                    setShowLostModal(true);
                  }}
                >
                  <DashboardButton
                    to="#"
                    icon={<LostAnimalIcon />}
                    title="Déclarer Perdu"
                    description="Signaler la perte de votre animal pour diffuser une alerte."
                  />
                </div>
              </div>
              <div className={!lostDeclaration || (animalData && animalData.is_radiated) ? "opacity-50 pointer-events-none grayscale" : ""}>
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    setDeclarationDate(new Date().toISOString().split("T")[0]);
                    setShowFoundModal(true);
                  }}
                >
                  <DashboardButton
                    to="#"
                    icon={<FoundAnimalIcon />}
                    title="Déclarer Retrouvé"
                    description="Indiquer que votre animal a été retrouvé."
                  />
                </div>
              </div>
              <div className={animalData && animalData.is_radiated ? "opacity-50 pointer-events-none grayscale" : ""}>
                <DashboardButton
                  to="/detent/declare-dead"
                  icon={<DeadAnimalIcon />}
                  title="Déclarer Décès"
                  description="Signaler le décès de l'animal aux services concernés."
                />
              </div>
              <div
                onClick={(e: any) => {
                  e.preventDefault();
                  handleGenerateCertificate();
                }}
              >
                <DashboardButton
                  to="#"
                  icon={<PrintIcon />}
                  title="Imprimer Certificat"
                  description="Télécharger ou imprimer la carte d'identification."
                />
              </div>
            </div>

            {/* Animal Details Area */}
            {!loading && animalData && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                  Détails de l'animal
                </h2>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Photo Section */}
                  <div className="shrink-0 flex flex-col items-center justify-start pt-2">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md mb-2">
                      {animalData.espece ? (
                        <img
                          src={`/Anims/${animalData.espece}.png`}
                          alt={animalData.l_nme}
                          className="w-full h-full object-scale-down p-3"
                        />
                      ) : (
                        <span className="text-4xl text-gray-300">🐾</span>
                      )}
                    </div>
                  </div>

                  <div className="grow grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                        <span className="mr-2">🐾</span> Informations Générales
                      </h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          <span className="font-medium text-gray-900">
                            Nom :
                          </span>{" "}
                          {animalData.l_nme || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            Numéro d'identification :
                          </span>{" "}
                          {animalData.num_ident}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            Espèce :
                          </span>{" "}
                          {animalData.espece || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            Race :
                          </span>{" "}
                          {animalData.race || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            Sexe :
                          </span>{" "}
                          {animalData.sexe || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            Date de naissance :
                          </span>{" "}
                          {animalData.date_naiss || "-"}
                        </p>
                      </div>
                    </div>
                    {VeterinaryData && (
                      <div>
                        <h3 className="text-lg font-semibold text-teal-700 mb-4 flex items-center">
                          <span className="mr-2">⚕️</span> Informations
                          Vétérinaire
                        </h3>
                        <div className="space-y-3 text-gray-700">
                          <p>
                            <span className="font-medium text-gray-900">
                              Vétérinaire :
                            </span>{" "}
                            {VeterinaryData.fam_nme} {VeterinaryData.nme}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Téléphone :
                            </span>{" "}
                            {VeterinaryData.phone || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Email :
                            </span>{" "}
                            {VeterinaryData.email || "-"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Adresse :
                            </span>{" "}
                            {[
                              VeterinaryData.adresse,
                              VeterinaryData.city,
                              VeterinaryData.wilaya,
                            ]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lost Modal */}
        {showLostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Déclarer l'animal perdu
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de la perte
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={declarationDate}
                      onChange={(e) => setDeclarationDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker()}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description / Circonstances
                  </label>
                  <textarea
                    value={declarationDesc}
                    onChange={(e) => setDeclarationDesc(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    placeholder="Où et comment l'animal a-t-il été perdu ?"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowLostModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleLostSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enregistrement..." : "Valider la perte"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Found Modal */}
        {showFoundModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Déclarer l'animal retrouvé
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de retrouvaille
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={declarationDate}
                      min={lostDeclaration?.lost_date ? lostDeclaration.lost_date.split("T")[0] : undefined}
                      onChange={(e) => setDeclarationDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker()}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowFoundModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleFoundSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enregistrement..." : "Valider"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <PgFooter />
    </div>
  );
}

// --- SVG Icons ---

const LostAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const FoundAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  </svg>
);

const DeadAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M12 2c-3.87 0-7 3.13-7 7v11c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V9c0-3.87-3.13-7-7-7zm4 12H8v-2h8v2zm0-4H8V8h8v2z"
    />
  </svg>
);

const PrintIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z" />
    <circle cx="18" cy="11.5" r="1" />
  </svg>
);
