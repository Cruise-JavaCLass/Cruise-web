import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ExcursionsPage } from './pages/ExcursionsPage';
import { ExcursionDetailPage } from './pages/ExcursionDetailPage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import { PosPage } from './pages/PosPage';
import { ItineraryPage } from './pages/ItineraryPage';
import { PassengersPage } from './pages/PassengersPage';
import { SettlementPage } from './pages/SettlementPage';
import { PassengerCatalogPage } from './pages/PassengerCatalogPage';
import { ShipsPage } from './pages/ShipsPage';
import { ShipDetailPage } from './pages/ShipDetailPage';
import { PassengerHomePage } from './pages/PassengerHomePage';
import { ExcursionAttendancePage } from './pages/ExcursionAttendancePage';
import { ExcursionAnalyticsDashboard } from './pages/ExcursionAnalyticsDashboard';
import { PassengerExcursionPassPage } from './pages/PassengerExcursionPassPage';
import { ExcursionDispatcherDashboard } from './pages/ExcursionDispatcherDashboard';
import { ActivityAttendancePage } from './pages/ActivityAttendancePage';
import { ActivityRosterPage } from './pages/ActivityRosterPage';
import { MySchedulePage } from './pages/MySchedulePage';
import { PassengerFolioPage } from './pages/passenger/PassengerFolioPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="passenger-home" element={<PassengerHomePage />} />
        <Route path="my-schedule" element={<MySchedulePage />} />
        <Route path="passenger/folio" element={<PassengerFolioPage />} />
        <Route path="ships" element={<ShipsPage />} />
        <Route path="ships/:id" element={<ShipDetailPage />} />
        <Route path="itinerary" element={<ItineraryPage />} />
        <Route path="excursions" element={<ExcursionsPage />} />
        <Route path="excursions/:id" element={<ExcursionDetailPage />} />
        <Route path="excursions/my-passes" element={<PassengerExcursionPassPage />} />
        <Route path="excursion-dispatcher" element={<ExcursionDispatcherDashboard />} />
        <Route path="excursion-attendance" element={<ExcursionAttendancePage />} />
        <Route path="excursion-analytics" element={<ExcursionAnalyticsDashboard />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="activities/:id" element={<ActivityDetailPage />} />
        <Route path="activities/:id/attendance" element={<ActivityAttendancePage />} />
        <Route path="activity-attendance" element={<ActivityAttendancePage />} />
        <Route path="activities/:id/roster" element={<ActivityRosterPage />} />
        <Route path="activity-roster" element={<ActivityRosterPage />} />
        <Route path="catalog" element={<PassengerCatalogPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="passengers" element={<PassengersPage />} />
        <Route path="billing/settlement" element={<SettlementPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

