
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  CarFront, 
  CalendarCheck, 
  DollarSign, 
  Bell, 
  Settings 
} from "lucide-react";

const OwnerSidebar = () => {
  const location = useLocation();
  
  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5 mr-2" />,
      href: "/owner-portal",
      active: location.pathname === "/owner-portal"
    },
    {
      label: "My Cars",
      icon: <CarFront className="h-5 w-5 mr-2" />,
      href: "/owner-portal",
      active: location.pathname === "/owner-portal" && location.hash === "#cars"
    },
    {
      label: "Booking Requests",
      icon: <Bell className="h-5 w-5 mr-2" />,
      href: "/owner-portal/bookings/requests",
      active: location.pathname === "/owner-portal/bookings/requests"
    },
    {
      label: "Bookings",
      icon: <CalendarCheck className="h-5 w-5 mr-2" />,
      href: "/owner-portal/bookings",
      active: location.pathname === "/owner-portal/bookings"
    },
    {
      label: "Earnings",
      icon: <DollarSign className="h-5 w-5 mr-2" />,
      href: "/owner-portal/earnings",
      active: location.pathname === "/owner-portal/earnings"
    }
  ];

  return (
    <div className="w-full lg:w-64 mb-6 lg:mb-0">
      <div className="bg-white shadow rounded-lg p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={item.active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                item.active ? "bg-rento-blue text-white" : "text-muted-foreground"
              )}
              asChild
            >
              <Link to={item.href}>
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default OwnerSidebar;
