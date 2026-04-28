import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";

const MainLayout = () => (
  <>
    <Header />
    <Outlet />
  </>
);

export default MainLayout;
