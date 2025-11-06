import { createBrowserRouter } from "react-router-dom";
import ReportsList from "../pages/reports/ReportsList";
import ReportNew from "../pages/reports/ReportNew";
import ReportDetail from "../pages/reports/ReportDetail";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Queue from "../pages/admin/Queue";
import Home from "../pages/Home";
import Discover from "../pages/Discover";
import Feed from "../pages/Feed";
import Settings from "../pages/settings/Settings";
import ErrorFallback from "../components/ErrorFallback";
import KycWizardOnly from "../pages/kyc/KycWizardOnly";
import Notifications from "../pages/notifications/Notifications";
import Debug from "./pages/Debug";
import App from "../App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // { index: true, element: <ReportsList /> },
      { path: "/", element: <Home /> },
      { path: "discover", element: <Discover /> },
      { path: "feed", element: <Feed /> },
      { path: "reports/new", element: <ReportNew /> },
      { path:"/kyc", element: <KycWizardOnly /> },   
      { path: "reports/:id", element: <ReportDetail /> },
      { path: "admin/queue", element: <Queue /> },
      { path: "settings/settings", element: <Settings /> },
      { path: "notifications/Notifications", element: <Notifications /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "/", element: <App />, errorElement: <ErrorFallback />,  
      },
      { path: "debug", element: <Debug /> },
    ],
  },
]);
