export interface Shift {
  id: string;
  name: string;
  start: string;
  end: string;
  breakMinutes: number;
}

export interface Site {
  id: string;
  empresaId: string;
  empresaName: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  timezone: string;
  active: boolean;
  shifts?: Shift[];
}

export interface SiteListResponse {
  sites: Site[];
}

export interface CreateSiteRequest {
  empresaId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  timezone?: string;
}

export interface UpdateSiteRequest {
  empresaId?: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  timezone?: string;
  active?: boolean;
}

export interface UpdateSiteResponse {
  id: string;
  updated: boolean;
}
