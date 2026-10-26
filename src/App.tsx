import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import RoleSelect from "./pages/RoleSelect";
import AuthScreen from "./pages/AuthScreen";
import Profile from "./pages/Profile";
import AddCard, { PaymentMethods } from "./pages/PaymentMethods";
import CustomerHome from "./pages/customer/CustomerHome";
import JoinRoute from "./pages/customer/JoinRoute";
import Payment from "./pages/customer/Payment";
import OtpConfirmation from "./pages/customer/OtpConfirmation";
import LiveTracking from "./pages/customer/LiveTracking";
import DeliveryComplete from "./pages/customer/DeliveryComplete";
import CustomerHistory from "./pages/customer/CustomerHistory";
import CustomerBroadcast from "./pages/customer/CustomerBroadcast";
import RequestPending from "./pages/customer/RequestPending";
import RiderHome from "./pages/rider/RiderHome";
import CreateRoute from "./pages/rider/CreateRoute";
import RiderRoute from "./pages/rider/RiderRoute";
import RiderOtp from "./pages/rider/RiderOtp";
import Broadcast from "./pages/rider/Broadcast";
import Earnings from "./pages/rider/Earnings";
import Admin from "./pages/admin/Admin";
import AdminLogin from "./pages/admin/AdminLogin";
import { AdminGuard } from "./pages/admin/AdminGuard";
import MoverHome from "./pages/mover/MoverHome";
import MoverOnboarding from "./pages/mover/MoverOnboarding";
import MoverRequests from "./pages/mover/MoverRequests";
import MoverJob from "./pages/mover/MoverJob";
import MoverEarnings from "./pages/mover/MoverEarnings";
import MovingHome from "./pages/customer/MovingHome";
import MovingRequestForm from "./pages/customer/MovingRequestForm";
import MovingDetail from "./pages/customer/MovingDetail";
import MovingChat from "./pages/MovingChat";
import CallScreen from "./pages/CallScreen";
import IncomingCallWatcher from "./components/IncomingCallWatcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/role" element={<RoleSelect />} />
            <Route path="/auth/login" element={<AuthScreen mode="login" />} />
            <Route path="/auth/signup" element={<AuthScreen mode="signup" />} />

            {/* Customer */}
            <Route path="/customer" element={<CustomerHome />} />
            <Route path="/customer/route/:id" element={<JoinRoute />} />
            <Route path="/customer/pending/:id" element={<RequestPending />} />
            <Route path="/customer/payment/:id" element={<Payment />} />
            <Route path="/customer/otp/:id" element={<OtpConfirmation />} />
            <Route path="/customer/track/:id" element={<LiveTracking />} />
            <Route path="/customer/complete/:id" element={<DeliveryComplete />} />
            <Route path="/customer/history" element={<CustomerHistory />} />
            <Route path="/customer/broadcast/:id" element={<CustomerBroadcast />} />
            <Route path="/customer/profile" element={<Profile role="customer" />} />
            <Route path="/customer/payment-methods" element={<PaymentMethods role="customer" />} />
            <Route path="/customer/payment-methods/add" element={<AddCard role="customer" />} />

            {/* Rider */}
            <Route path="/rider" element={<RiderHome />} />
            <Route path="/rider/create" element={<CreateRoute />} />
            <Route path="/rider/route/:id" element={<RiderRoute />} />
            <Route path="/rider/otp/:id" element={<RiderOtp />} />
            <Route path="/rider/broadcast/:id" element={<Broadcast />} />
            <Route path="/rider/earnings" element={<Earnings />} />
            <Route path="/rider/profile" element={<Profile role="rider" />} />
            <Route path="/rider/payment-methods" element={<PaymentMethods role="rider" />} />
            <Route path="/rider/payment-methods/add" element={<AddCard role="rider" />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />

            {/* Mover */}
            <Route path="/mover" element={<MoverHome />} />
            <Route path="/mover/onboard" element={<MoverOnboarding />} />
            <Route path="/mover/requests" element={<MoverRequests />} />
            <Route path="/mover/job/:id" element={<MoverJob />} />
            <Route path="/mover/earnings" element={<MoverEarnings />} />
            <Route path="/mover/profile" element={<Profile role="mover" />} />
            <Route path="/mover/payment-methods" element={<PaymentMethods role="mover" />} />
            <Route path="/mover/payment-methods/add" element={<AddCard role="mover" />} />

            {/* Moving services (customer) */}
            <Route path="/customer/moving" element={<MovingHome />} />
            <Route path="/customer/moving/new" element={<MovingRequestForm />} />
            <Route path="/customer/moving/:id" element={<MovingDetail />} />

            {/* Shared booking chat + in-app calls */}
            <Route path="/moving-chat/:bookingId" element={<MovingChat />} />
            <Route path="/call/:sessionId" element={<CallScreen />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <IncomingCallWatcher />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
