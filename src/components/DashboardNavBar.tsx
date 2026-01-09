import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { UserRole } from "../main";

// --- Icon Components ---

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const AnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5c-2.42 0-4.5-1.03-4.5-3.5S7.58 7.5 10 7.5s4.5 1.03 4.5 3.5-2.08 6.5-4.5 6.5zm6.5-3.5c0 2.47-2.08 3.5-4.5 3.5s-4.5-1.03-4.5-3.5 2.08-3.5 4.5-3.5 4.5 1.03 4.5 3.5z" />
  </svg>
);

const ReportDiseaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM17 9.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0ZM21.435 22.492A9.502 9.502 0 0 0 12 15a9.502 9.502 0 0 0-9.435 7.492l-.995-1.99a11.5 11.5 0 0 1 20.86 0l-.995 1.99Z" />
  </svg>
);

const StatsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7.5 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm9-10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-4.5 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
    <path d="M5.1 16a1 1 0 0 0-1.042.93l-1 5A1 1 0 0 0 4 23h16a1 1 0 0 0 .942-1.07l-3-10A1 1 0 0 0 17 11H3a1 1 0 0 0-.942 1.07l2 5A1 1 0 0 0 5.1 16ZM11.5 8a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h7.5a1 1 0 0 0 1-1Z" />
  </svg>
);

const OwnerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14c-3.87 0-7 1.79-7 4v2h14v-2c0-2.21-3.13-4-7-4z" />
  </svg>
);

const LostAnimalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);


const VaccineIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.95 4.05c-2.25-2.25-5.89-2.25-8.14 0L4.05 11.81c-2.25 2.25-2.25 5.89 0 8.14 2.25 2.25 5.89 2.25 8.14 0l7.76-7.76c2.25-2.25 2.25-5.89 0-8.14zM11 18.17l-5.66-5.66 1.41-1.41 1.41 1.41 1.41-1.41 1.42 1.41 1.41-1.41 1.41 1.41L18.17 13l-7.17 5.17z" />
  </svg>
);

const LabIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 2a.5.5 0 0 1 .5.5V3h2V2.5a.5.5 0 0 1 1 0V3h2.293l-3.427 3.427A6.98 6.98 0 0 1 13 10.83V18h3.5a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1H11v-7.17a6.98 6.98 0 0 1 .134-4.403L7.707 3H10v-.5a.5.5 0 0 1 .5-.5zM8.414 4 11.414 7h1.172l3-3H13v.5a.5.5 0 0 1-1 0V4h-1.586zM12 8a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-3 5a3 3 0 1 1 6 0 3 3 0 0 1-6 0z"
    />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

const adminLinks = [
  { to: "/admindashboard", title: "Tableau de Bord", icon: <HomeIcon /> },
  { to: "/managevets", title: "Gestion des Utilisateurs", icon: <UsersIcon /> },
  { to: "/admin/animals", title: "Gestion des Animaux", icon: <AnimalIcon /> },
  {
    to: "/ownersmanage",
    title: "Gestion des Propriétaires",
    icon: <OwnerIcon />,
  },
  {
    to: "/admin/declarations",
    title: "Gestion des Déclarations",
    icon: <ReportDiseaseIcon />,
  },
  {
    to: "/admin/vaccines",
    title: "Stock de vaccins",
    icon: <VaccineIcon />,
  },
  {
    to: "/underdevelopment",
    title: "Laboratoires",
    icon: <LabIcon />,
  },
  { to: "/stats", title: "Statistiques", icon: <StatsIcon /> },
];

const vetLinks = [
  { to: "/vetsdashboard", title: "Tableau de Bord", icon: <HomeIcon /> },
  {
    to: "/ownersmanage",
    title: "Gestion des Propriétaires",
    icon: <OwnerIcon />,
  },
  { to: "/animalsmanage", title: "Animaux", icon: <AnimalIcon /> },
  {
    to: "/vets/declarer-maladie",
    title: "Déclarer Maladie",
    icon: <ReportDiseaseIcon />,
  },
  {
    to: "/DeclareAnimalLost",
    title: "Signaler un Animal Perdu/Retrouvé",
    icon: <LostAnimalIcon />,
  },
];

const ayDroitLinks = [
  { to: "/aydroitdashboard", title: "Tableau de Bord", icon: <HomeIcon /> },
  {
    to: "/DeclareAnimalLost",
    title: "Signaler un Animal Perdu/Retrouvé",
    icon: <LostAnimalIcon />,
  },
];

interface DashboardNavBarProps {
  role: string | null;
}

export default function DashboardNavBar({ role }: DashboardNavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = useMemo(() => {
    switch (role) {
      case UserRole.Adminis:
        return adminLinks;
      case UserRole.Vet:
        return vetLinks;
      case UserRole.AyDroit:
        return ayDroitLinks;
      default:
        return []; // Return empty or a default set of links
    }
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NavButton = ({ to, title, icon }: (typeof adminLinks)[0]) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
          ? "bg-cyan-700 text-white"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        }`
      }
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span>{title}</span>
    </NavLink>
  );

  if (navLinks.length === 0) return null;

  return (
    <nav className="bg-gray-100 border-b border-gray-200" ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Spacer div to push the menu to the right on mobile */}
          <div className="md:hidden"></div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <NavButton key={link.to} {...link} />
            ))}
          </div>

          {/* Mobile Menu Container */}
          <div className="relative md:hidden">
            {/* Mobile Menu Button */}
            <div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-200"
              >
                <MenuIcon />
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20">
                <div className="py-1">
                  {navLinks.map((link) => (
                    <NavButton key={link.to} {...link} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
