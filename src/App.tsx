
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CarListing from "./pages/CarListing";
import CarDetail from "./pages/CarDetail";
import AdminKyc from "./pages/AdminKyc";
import CreateAdmin from "./pages/CreateAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerPortal from "./pages/OwnerPortal";
import MyTrips from "./pages/MyTrips";
import ChatPage from "./pages/ChatPage";
import AddEditCar from "./pages/owner/AddEditCar";
import BookingRequests from "./pages/owner/BookingRequests";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerEarnings from "./pages/owner/OwnerEarnings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cars" element={<CarListing />} />
              <Route path="/cars/:id" element={<CarDetail />} />
              <Route path="/owner-portal" element={<OwnerPortal />} />
              <Route path="/owner-portal/cars/new" element={<AddEditCar />} />
              <Route path="/owner-portal/cars/edit/:id" element={<AddEditCar />} />
              <Route path="/owner-portal/bookings/requests" element={<BookingRequests />} />
              <Route path="/owner-portal/bookings" element={<OwnerBookings />} />
              <Route path="/owner-portal/earnings" element={<OwnerEarnings />} />
              <Route path="/trips" element={<MyTrips />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/admin/kyc" element={<AdminKyc />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/create-admin" element={<CreateAdmin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ChatProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
