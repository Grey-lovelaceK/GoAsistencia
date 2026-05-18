import { api, buildQuery } from "./api";
import * as mocks from "./mocks";
import type { ReportResponse, ReportFilters, ReportExportResponse } from "@/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const reportsService = {
  getReports: (filters: ReportFilters): Promise<ReportResponse> =>
    USE_MOCKS
      ? mocks.getReports(filters)
      : api.get<ReportResponse>(`/reports${buildQuery(filters)}`),

  exportReports: (filters: ReportFilters): Promise<ReportExportResponse> =>
    USE_MOCKS
      ? mocks.exportReports(filters)
      : api.get<ReportExportResponse>(`/reports/export${buildQuery(filters)}`),
};
