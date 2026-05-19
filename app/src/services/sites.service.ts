import { api } from "./api";
import * as mocks from "./mocks";
import type { SiteListResponse, Site, CreateSiteRequest, UpdateSiteRequest, Shift, CreateShiftRequest, UpdateShiftRequest } from "@/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const sitesService = {
  getSites: (): Promise<SiteListResponse> =>
    USE_MOCKS ? mocks.getSites() : api.get<SiteListResponse>("/sites"),

  getSite: (siteId: string): Promise<Site> =>
    USE_MOCKS ? mocks.getSite(siteId) : api.get<Site>(`/sites/${siteId}`),

  createSite: (data: CreateSiteRequest): Promise<Site> =>
    api.post<Site>("/sites", data),

  updateSite: (id: string, data: UpdateSiteRequest): Promise<Site> =>
    USE_MOCKS ? mocks.updateSite(id, data) : api.put<Site>(`/sites/${id}`, data),

  createShift: (siteId: string, data: CreateShiftRequest): Promise<Shift> =>
    USE_MOCKS ? mocks.createShift(siteId, data) : api.post<Shift>(`/sites/${siteId}/shifts`, data),

  updateShift: (siteId: string, shiftId: string, data: UpdateShiftRequest): Promise<Shift> =>
    USE_MOCKS ? mocks.updateShift(siteId, shiftId, data) : api.put<Shift>(`/sites/${siteId}/shifts/${shiftId}`, data),

  deleteShift: (siteId: string, shiftId: string): Promise<{ id: string; deleted: boolean }> =>
    USE_MOCKS ? mocks.deleteShift(siteId, shiftId) : api.delete<{ id: string; deleted: boolean }>(`/sites/${siteId}/shifts/${shiftId}`),
};
