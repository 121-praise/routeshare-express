import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import RoleSelect from "./pages/RoleSelect";
import AuthScreen from "./pages/AuthScreen";
import Profile from "./pages/Profile";
import CustomerHome from "./pages/customer/CustomerHome";
import JoinRoute from "./pages/customer/JoinRoute";
import Payment from "./pages/customer/Payment";
import OtpConfirmation from "./pages/customer/OtpConfirmation";
import LiveTracking from "./pages/customer/LiveTracking";
import DeliveryComplete from "./pages/customer/DeliveryComplete";
import CustomerHistory from "./pages/customer/CustomerHistory";
import RiderHome from "./pages/rider/RiderHome";
import CreateRoute from "./pages/rider/CreateRoute";
import RiderRoute from "./pages/rider/RiderRoute";
import RiderOtp from "./pages/rider/RiderOtp";
import Broadcast from "./pages/rider/Broadcast";
import Earnings from "./pages/rider/Earnings";
import Admin from "./pages/admin/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/role" element={<RoleSelect />} />
          <Route path="/auth/login" element={<AuthScreen mode="login" />} />
          <Route path="/auth/signup" element={<AuthScreen mode="signup" />} />

          {/* Customer */}
          <Route path="/customer" element={<CustomerHome />} />
          <Route path="/customer/route/:id" element={<JoinRoute />} />
          <Route path="/customer/payment/:id" element={<Payment />} />
          <Route path="/customer/otp/:id" element={<OtpConfirmation />} />
          <Route path="/customer/track/:id" element={<LiveTracking />} />
          <Route path="/customer/complete/:id" element={<DeliveryComplete />} />
          <Route path="/customer/history" element={<CustomerHistory />} />
          <Route path="/customer/profile" element={<Profile role="customer" />} />

          {/* Rider */}
          <Route path="/rider" element={<RiderHome />} />
          <Route path="/rider/create" element={<CreateRoute />} />
          <Route path="/rider/route/:id" element={<RiderRoute />} />
          <Route path="/rider/otp/:id" element={<RiderOtp />} />
          <Route path="/rider/broadcast/:id" element={<Broadcast />} />
          <Route path="/rider/earnings" element={<Earnings />} />
          <Route path="/rider/profile" element={<Profile role="rider" />} />

          {/* Admin */}
          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
