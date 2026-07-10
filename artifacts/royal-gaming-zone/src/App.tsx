import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Menu from "@/pages/Menu";
import CustomerPortal from "@/pages/CustomerPortal";
import AdminLogin from "@/pages/AdminLogin";
import AdminAccounts from "@/pages/AdminAccounts";
import AdminAccountDetail from "@/pages/AdminAccountDetail";
import Booking from "@/pages/Booking";
import RechargeWallet from "@/pages/admin/RechargeWallet";
import Payment from "@/pages/admin/Payment";
import TelegramSettings from "@/pages/admin/TelegramSettings";
import NotificationSettings from "@/pages/admin/NotificationSettings";
import AuditLog from "@/pages/admin/AuditLog";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/menu" component={Menu} />
      <Route path="/booking" component={Booking} />
      <Route path="/customer-portal" component={CustomerPortal} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/accounts" component={AdminAccounts} />
      <Route path="/admin/accounts/:phone" component={AdminAccountDetail} />
      <Route path="/admin/recharge" component={RechargeWallet} />
      <Route path="/admin/payment" component={Payment} />
      <Route path="/admin/telegram-settings" component={TelegramSettings} />
      <Route path="/admin/notification-settings" component={NotificationSettings} />
      <Route path="/admin/audit-log" component={AuditLog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("dark");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <FloatingWhatsApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
