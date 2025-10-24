import { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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

const VaccineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM5.88 21l-1.06-1.06 14.14-14.14 1.06 1.06L5.88 21zM12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
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

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

const adminLinks = [
  { to: "/admindashboard", title: "Tableau de Bord", icon: <HomeIcon /> },
  { to: "/managevets", title: "Gérer Vétérinaires", icon: <UsersIcon /> },
  { to: "/stats", title: "Statistiques", icon: <StatsIcon /> },
];

const vetLinks = [
  { to: "/vetsdashboard", title: "Tableau de Bord", icon: <HomeIcon /> },
  { to: "/vets/animaux", title: "Animaux", icon: <AnimalIcon /> },
  { to: "/vets/vaccinations", title: "Vaccinations", icon: <VaccineIcon /> },
  { to: "/vets/rendez-vous", title: "Rendez-vous", icon: <CalendarIcon /> },
  {
    to: "/vets/declarer-maladie",
    title: "Déclarer Maladie",
    icon: <ReportDiseaseIcon />,
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
      // Add cases for other roles like AyDroit if needed
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
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
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
