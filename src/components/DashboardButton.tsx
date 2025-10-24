import { Link } from "react-router-dom";
import { type ReactNode } from "react";

interface DashboardButtonProps {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export default function DashboardButton({
  to,
  icon,
  title,
  description,
}: DashboardButtonProps) {
  return (
    <Link
      to={to}
      className="
        group
        flex flex-col
        bg-white
        p-6
        rounded-xl
        shadow-lg
        hover:shadow-2xl
        hover:scale-105
        transition-all
        duration-300
        ease-in-out
        border
        border-gray-200
        cursor-pointer
        min-h-48 w-64
        justify-between
      "
    >
      <div>
        <div className="bg-cyan-100 text-cyan-700 rounded-lg p-3 w-fit mb-4 transition-colors duration-300 group-hover:bg-cyan-200">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
