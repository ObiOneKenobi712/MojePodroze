import { Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout/Layout";
import RequireAuth from "./components/RequireAuth/RequireAuth";
import TripsPage from "./pages/TripsPage/TripsPage";
import TripDetailsPage from "./pages/TripDetailsPage/TripDetailsPage";
import StatsPage from "./pages/StatsPage/StatsPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import TripFormPage from "./pages/TripFormPage/TripFormPage";

export default function App() {
  return (
    <Routes>
      <Route path="logowanie" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/podroze" replace />} />
          <Route path="podroze" element={<TripsPage />} />
          <Route path="podroze/nowa" element={<TripFormPage />} />
          <Route path="podroze/:tripId" element={<TripDetailsPage />} />
          <Route path="podroze/:tripId/edycja" element={<TripFormPage />} />
          <Route path="statystyki" element={<StatsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
