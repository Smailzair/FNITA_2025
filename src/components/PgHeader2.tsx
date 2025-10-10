import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserByEmail, supabase } from "../api/supabaseClient";

export const PgHeader2 = () => {
  const [user_full_name, setUserFullName] = useState<string | null>(null);
  const [user_type, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) navigate("/login");
      else {
        const user_infos = await getUserByEmail(
          data.session.user.email as string
        );

        if (user_infos !== null) {
          setUserFullName(user_infos.fam_nme ? user_infos.fam_nme : null);
          setUserType(user_type ? user_type : null);
        }
      }
    };
    getSession();
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="bg-teal-900">
      <div className="mx-auto max-sm:ml-0 max-md:ml-2 ml-8 ">
        <div className="relative flex h-20 items-center justify-between">
          <div className="flex flex-grow items-center justify-center sm:justify-star">
            <div className="items-center min-w-fit">
              <Link to={".."}>
                <img
                  src="/LOGO_ALG.png"
                  alt="LOGO_ALG"
                  width={360}
                  height={360}
                  className="h-16 w-16 min-w-full"
                />
              </Link>
            </div>
            <div className="flex flex-auto items-center justify-center sm:block ml-1 mr-1">
              <p className="whitespace-nowrap text-center text-gray-50 text-sm max-sm:text-xs pl-0 min-w-fit">
                République algérienne démocratique et populaire
                <br />
                Ministère de l&apos;Agriculture et du Développement Rural
                <br />
                Fichier National d&apos;Identification et Traçabilité Animale
              </p>
            </div>
            <div className="absolute inset-y-0 right-0 flex flex-col items-center pr-2 max-sm:hidden min-w-fit text-xs w-fit h-full justify-center">
              <label className="text-green-200 text-center">Bienvenue</label>
              <label className="text-slate-200 text-center">
                Mr. {user_full_name}
              </label>
              <label className="text-orange-200 text-center">
                - {user_type} -
              </label>

              <button
                onClick={() => handleLogout()}
                className="bg-stone-700 hover:bg-stone-500 p-1 rounded-md"
              >
                Déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
