export interface Shift {
  id: string;
  name: string;
  start: string;
  end: string;
  breakMinutes: number;
}

export interface Site {
  id: string;
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

export interface UpdateSiteRequest {
  radiusMeters?: number;
  active?: boolean;
  shifts?: Shift[];
}

export interface UpdateSiteResponse {
  id: string;
  updated: boolean;
}
