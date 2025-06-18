import { Link, useLocation } from "wouter";
import { Microscope, LayoutDashboard, Users, BriefcaseMedical, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/patients",
      label: "Patients",
      icon: Users,
    },
    {
      path: "/references",
      label: "References",
      icon: BriefcaseMedical,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Microscope className="text-primary text-xl" />
          <h1 className="text-xl font-semibold text-gray-900">Tumor Registry</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  isActive(item.path)
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-5 h-5 text-gray-400" />
          </Button>
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-white text-sm font-medium">
                DR
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700">Dr. Rodriguez</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
