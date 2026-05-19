import { api } from "./api";
import * as mocks from "./mocks";
import type { SiteListResponse, Site, CreateSiteRequest, UpdateSiteRequest } from "@/types";

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
};
