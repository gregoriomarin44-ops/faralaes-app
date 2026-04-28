import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import MyListings from "./pages/MyListings.tsx";
import Favorites from "./pages/Favorites.tsx";
import CatalogPage from "./pages/CatalogPage.tsx";
import MainLayout from "./layouts/MainLayout.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import EditProfile from "./pages/EditProfile.tsx";
import Messages from "./pages/Messages.tsx";
import AdminReports from "./pages/AdminReports.tsx";
import Admin from "./pages/Admin.tsx";
import { AvisoLegal, Cookies, Privacidad, Terminos } from "./pages/LegalPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/usuario/:id" element={<UserProfile />} />
            <Route path="/perfil" element={<EditProfile />} />
            <Route path="/mensajes" element={<Messages />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/mis-anuncios" element={<MyListings />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/aviso-legal" element={<AvisoLegal />} />
            <Route path="/privacidad" element={<Privacidad />} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/cookies" element={<Cookies />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
