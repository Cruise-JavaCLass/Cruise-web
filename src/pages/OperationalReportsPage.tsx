import React, { useState } from 'react';
import { OperationalReportDashboard } from '../components/reports/OperationalReportDashboard';
import { ExportJobTrackerDrawer } from '../components/reports/ExportJobTrackerDrawer';

export const OperationalReportsPage: React.FC = () => {
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <OperationalReportDashboard
        onOpenExportDrawer={() => {
          setRefreshSignal((prev) => prev + 1);
          setIsTrackerOpen(true);
        }}
      />
      <ExportJobTrackerDrawer
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        triggerRefreshSignal={refreshSignal}
      />
    </div>
  );
};
