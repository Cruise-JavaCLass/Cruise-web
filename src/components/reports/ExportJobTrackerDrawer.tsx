import React, { useState, useEffect, useRef } from 'react';
import { useModalFocusTrap } from '../pos/useModalFocusTrap';
import { 
  X, 
  Download, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  FileSpreadsheet, 
  ExternalLink 
} from 'lucide-react';
import type { ReportExportJob, ExportFormat } from '../../services/reportTypes';
import { operationalReportService } from '../../services/operationalReportService';

interface ExportJobTrackerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRefreshSignal?: number;
}

export const ExportJobTrackerDrawer: React.FC<ExportJobTrackerDrawerProps> = ({
  isOpen,
  onClose,
  triggerRefreshSignal = 0,
}) => {
  const [jobs, setJobs] = useState<ReportExportJob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGenerationRef = useRef(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchJobs = async () => {
    const generation = ++fetchGenerationRef.current;
    try {
      setLoading(true);
      setError(null);
      const data = await operationalReportService.getExportJobs();
      if (generation !== fetchGenerationRef.current) return;
      setJobs(data);
    } catch (err: unknown) {
      if (generation !== fetchGenerationRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to fetch export tasks';
      setError(msg);
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchJobs();
    }
  }, [isOpen, triggerRefreshSignal]);

  useModalFocusTrap({
    isOpen,
    containerRef: drawerRef,
    onClose,
  });

  if (!isOpen) return null;

  const renderFormatBadge = (format: ExportFormat) => {
    switch (format) {
      case 'CSV':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileSpreadsheet className="w-3 h-3" /> CSV
          </span>
        );
      case 'EXCEL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileSpreadsheet className="w-3 h-3" /> EXCEL
          </span>
        );
      case 'PDF':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <FileText className="w-3 h-3" /> PDF
          </span>
        );
      default:
        return <span>{format}</span>;
    }
  };

  const renderStatus = (status: ReportExportJob['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3 h-3 animate-spin" /> Pending
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <RefreshCw className="w-3 h-3 animate-spin" /> Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownload = (job: ReportExportJob) => {
    if (job.downloadUrl) {
      window.open(job.downloadUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0B1F33]/60 backdrop-blur-xs transition-opacity flex justify-end">
      <div 
        ref={drawerRef}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform border-l border-[#E5E0D7]"
        role="dialog"
        aria-modal="true"
        aria-label="Export Jobs Tracker"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED] shrink-0">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#102A43] flex items-center gap-2">
              <Download className="w-5 h-5 text-[#102A43]" /> Export Downloads
            </h2>
            <p className="text-xs text-[#687787] mt-0.5">Track background report generation status</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchJobs()}
              disabled={loading}
              className="p-1.5 text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/50 rounded-lg transition-colors cursor-pointer"
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/50 rounded-lg transition-colors cursor-pointer"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading && jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#687787]">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#102A43]" />
              <p className="text-sm font-medium">Loading background exports...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#687787] text-center">
              <FileSpreadsheet className="w-10 h-10 mb-2 text-[#102A43]/40" />
              <p className="text-sm font-serif font-bold text-[#102A43]">No export jobs queued</p>
              <p className="text-xs text-[#687787] mt-1 max-w-xs">
                Generated reports in CSV, Excel, or PDF formats will be available here for download.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white border border-[#E5E0D7] rounded-xl p-3.5 shadow-xs relative"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {renderFormatBadge(job.format)}
                    <span className="text-xs font-semibold text-[#252B32]">
                      {job.reportTitle || `Job #${job.jobId.substring(0, 8)}`}
                    </span>
                  </div>
                  {renderStatus(job.status)}
                </div>

                <div className="text-xs text-[#687787] space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-mono text-[#252B32]">
                      {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {job.fileSizeBytes && (
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-semibold text-[#102A43]">
                        {(job.fileSizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                  {job.errorMessage && (
                    <div className="text-rose-700 bg-rose-50 p-2 rounded-lg text-[11px] mt-1 border border-rose-200">
                      {job.errorMessage}
                    </div>
                  )}
                </div>

                {job.status === 'COMPLETED' && Boolean(job.downloadUrl) && (
                  <button
                    onClick={() => handleDownload(job)}
                    className="w-full py-1.5 px-3 bg-[#F7F4ED] hover:bg-[#E5E0D7] text-[#102A43] font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-[#E5E0D7] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                    <ExternalLink className="w-3 h-3 text-[#102A43] ml-0.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#E5E0D7] bg-[#F7F4ED] text-center shrink-0">
          <p className="text-[11px] text-[#687787]">
            Export files are stored temporarily and expire after 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
};
