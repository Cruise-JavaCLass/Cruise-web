import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ItineraryPage } from './pages/ItineraryPage';
import { ExcursionsPage } from './pages/ExcursionsPage';
import { ExcursionDetailPage } from './pages/ExcursionDetailPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import { PosPage } from './pages/PosPage';
import { PassengersPage } from './pages/PassengersPage';
import { PassengerCatalogPage } from './pages/PassengerCatalogPage';
import { ShipsPage } from './pages/ShipsPage';
import { ShipDetailPage } from './pages/ShipDetailPage';
import { PassengerHomePage } from './pages/PassengerHomePage';
import { ExcursionAttendancePage } from './pages/ExcursionAttendancePage';
import { ActivityAttendancePage } from './pages/ActivityAttendancePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="passenger-home" element={<PassengerHomePage />} />
        <Route path="ships" element={<ShipsPage />} />
        <Route path="ships/:id" element={<ShipDetailPage />} />
        <Route path="itinerary" element={<ItineraryPage />} />
        <Route path="excursions" element={<ExcursionsPage />} />
        <Route path="excursions/:id" element={<ExcursionDetailPage />} />
        <Route path="excursion-attendance" element={<ExcursionAttendancePage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="activities/:id" element={<ActivityDetailPage />} />
        <Route path="activities/:id/attendance" element={<ActivityAttendancePage />} />
        <Route path="activity-attendance" element={<ActivityAttendancePage />} />
        <Route path="catalog" element={<PassengerCatalogPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="passengers" element={<PassengersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
