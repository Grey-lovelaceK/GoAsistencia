import { api } from "./api";
import * as mocks from "./mocks";
import type {
  AuthResponse,
  LoginRequest,
  WebAuthnChallenge,
  WebAuthnRegisterChallenge,
  WebAuthnVerifyPayload,
  WebAuthnRegisterVerifyPayload,
} from "@/types";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export const authService = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    USE_MOCKS ? mocks.login(data) : api.post<AuthResponse>("/auth/login", data),

  challenge: (rut: string): Promise<WebAuthnChallenge> =>
    api.post<WebAuthnChallenge>("/auth/challenge", { rut }),

  verify: (payload: WebAuthnVerifyPayload): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/verify", payload),

  registerChallenge: (data: { rut: string; password: string }): Promise<WebAuthnRegisterChallenge> =>
    api.post<WebAuthnRegisterChallenge>("/auth/register/challenge", data),

  registerVerify: (payload: WebAuthnRegisterVerifyPayload): Promise<{ registered: boolean }> =>
    api.post<{ registered: boolean }>("/auth/register/verify", payload),
};
