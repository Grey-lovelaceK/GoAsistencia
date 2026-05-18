import { api } from "./api";
import * as mocks from "./mocks";
import type { SiteListResponse, Site, UpdateSiteRequest } from "@/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const sitesService = {
  getSites: (): Promise<SiteListResponse> =>
    USE_MOCKS ? mocks.getSites() : api.get<SiteListResponse>("/sites"),

  getSite: (siteId: string): Promise<Site> =>
    USE_MOCKS ? mocks.getSite(siteId) : api.get<Site>(`/sites/${siteId}`),

  updateSite: (id: string, data: UpdateSiteRequest): Promise<{ id: string; updated: boolean }> =>
    USE_MOCKS ? mocks.updateSite(id, data) : api.put<{ id: string; updated: boolean }>(`/sites/${id}`, data),
};
