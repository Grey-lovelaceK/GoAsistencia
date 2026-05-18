import { api, buildQuery } from "./api";
import * as mocks from "./mocks";
import type { PunchListResponse, PresignedUrlResponse, PunchRequest, PunchResponse } from "@/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const punchesService = {
  getPunches: (params?: { from?: string; to?: string; limit?: number }): Promise<PunchListResponse> =>
    USE_MOCKS
      ? mocks.getPunches()
      : api.get<PunchListResponse>(`/punches${buildQuery(params)}`),

  getPresignedUrl: (): Promise<PresignedUrlResponse> =>
    USE_MOCKS
      ? mocks.getPresignedUrl()
      : api.post<PresignedUrlResponse>("/punches/presigned-url", { contentType: "image/jpeg" }),

  uploadPhoto: (uploadUrl: string, blob: Blob): Promise<Response> =>
    USE_MOCKS
      ? Promise.resolve(new Response(null, { status: 200 }))
      : api.putBlob(uploadUrl, blob, "image/jpeg"),

  createPunch: (data: PunchRequest): Promise<PunchResponse> =>
    USE_MOCKS ? mocks.createPunch(data) : api.post<PunchResponse>("/punches", data),
};
