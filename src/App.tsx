import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./routes/Login.jsx";
import ProviderHome from "./routes/ProviderHome.jsx";
import ScanPage from "./routes/ScanPage.jsx";
import ToiletDetailProvider from "./routes/ToiletDetailProvider.jsx";
import AdminDashboard from "./routes/AdminDashboard.jsx";
import AdminToiletDetail from "./routes/AdminToiletDetail.jsx";
import ReportsPage from "./routes/ReportsPage.jsx";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/provider" element={<ProviderHome />} />
      <Route path="/provider/scan" element={<ScanPage />} />
      <Route path="/provider/scan/:toiletId" element={<ToiletDetailProvider />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/toilet/:toiletId" element={<AdminToiletDetail />} />
      <Route path="/admin/reports" element={<ReportsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
