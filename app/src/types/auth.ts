export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthUser {
  id: string;
  rut: string;
  email: string;
  name: string;
  role: "employee" | "supervisor" | "admin";
  siteId: string;
  passkey?: boolean;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

export interface WebAuthnChallenge {
  challenge: string;
  rpId: string;
  timeout: number;
  allowCredentials: Array<{
    id: string;
    type: string;
    transports: string[];
  }>;
  userVerification: string;
}

export interface WebAuthnVerifyPayload {
  rut: string;
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
}

export interface WebAuthnRegisterChallenge {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  authenticatorSelection: Record<string, unknown>;
  timeout: number;
}

export interface WebAuthnRegisterVerifyPayload {
  rut: string;
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
}
