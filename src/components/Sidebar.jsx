"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role = "user" }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/clients", label: "Clients", roles: ["user", "admin", "manager"] },
    { href: "/dashboard/maintenance", label: "Maintenance", roles: ["admin", "manager"] },
    { href: "/dashboard/reports", label: "Reports", roles: ["admin"] },
    { href: "/dashboard/census", label: "Census", roles: ["user", "admin", "manager"] },
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen p-4">
      <nav className="space-y-2">
        {navItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                pathname === item.href
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
      </nav>
    </aside>
  );
}
