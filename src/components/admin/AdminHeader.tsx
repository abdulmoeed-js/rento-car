
import React from "react";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Users, 
  Car, 
  Calendar, 
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "KYC Verification", href: "/admin/kyc", icon: Shield },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Cars", href: "/admin/cars", icon: Car },
  { label: "Bookings", href: "/admin/bookings", icon: Calendar },
];

export const AdminHeader: React.FC = () => {
  const { signOut } = useAuth();

  const NavItems = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100"
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link to="/admin" className="font-bold text-xl flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <span>Rento Admin</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <NavItems />
          <Button variant="ghost" onClick={signOut} className="flex gap-2">
            <LogOut className="h-5 w-5" /> 
            <span>Sign Out</span>
          </Button>
        </nav>

        {/* Mobile navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col space-y-4 py-4">
              <Link to="/admin" className="font-bold text-xl flex items-center gap-2 pb-2 border-b mb-2">
                <Shield className="h-6 w-6" />
                <span>Rento Admin</span>
              </Link>
              <NavItems />
              <Button variant="ghost" onClick={signOut} className="flex gap-2 w-full justify-start">
                <LogOut className="h-5 w-5" /> 
                <span>Sign Out</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
