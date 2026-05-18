import { authService } from "@/services/auth.service";
import { normalizeIdentifier } from "@/lib/auth";
import type { WebAuthnRegisterChallenge } from "@/types";

const b64Decode = (s: string): ArrayBuffer =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)).buffer as ArrayBuffer;

const b64Encode = (b: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(b)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

export async function stepUpBiometrics(rut: string): Promise<string> {
  const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

  // Skip real WebAuthn in mock mode or if device doesn't support it
  if (useMocks || !window.PublicKeyCredential) {
    await new Promise<void>((r) => setTimeout(r, 500));
    return `mock_webauthn_${Date.now()}`;
  }

  const normalizedRut = normalizeIdentifier(rut);
  const { challenge, allowCredentials, rpId } = await authService.challenge(normalizedRut);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: b64Decode(challenge),
      rpId,
      allowCredentials: allowCredentials.map((c) => ({
        id: b64Decode(c.id),
        type: "public-key" as const,
        transports: c.transports as AuthenticatorTransport[],
      })),
      userVerification: "required",
      timeout: 60_000,
    },
  });

  if (!assertion) throw new Error("CANCELLED");

  const cred = assertion as PublicKeyCredential;
  const res = cred.response as AuthenticatorAssertionResponse;

  const result = await authService.verify({
    rut: normalizedRut,
    credentialId: cred.id,
    clientDataJSON: b64Encode(res.clientDataJSON),
    authenticatorData: b64Encode(res.authenticatorData),
    signature: b64Encode(res.signature),
    userHandle: res.userHandle ? b64Encode(res.userHandle) : "",
  });

  return result.token;
}

export async function registerPasskey(rut: string, password: string): Promise<void> {
  const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

  if (useMocks || !window.PublicKeyCredential) {
    await new Promise<void>((r) => setTimeout(r, 800));
    return;
  }

  const normalizedRut = normalizeIdentifier(rut);
  const options: WebAuthnRegisterChallenge = await authService.registerChallenge({
    rut: normalizedRut,
    password,
  });

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: b64Decode(options.challenge),
      rp: options.rp,
      user: {
        id: b64Decode(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams as PublicKeyCredentialParameters[],
      authenticatorSelection: options.authenticatorSelection as AuthenticatorSelectionCriteria,
      timeout: options.timeout,
    },
  });

  if (!credential) throw new Error("CANCELLED");

  const cred = credential as PublicKeyCredential;
  const res = cred.response as AuthenticatorAttestationResponse;

  await authService.registerVerify({
    rut: normalizedRut,
    credentialId: cred.id,
    clientDataJSON: b64Encode(res.clientDataJSON),
    attestationObject: b64Encode(res.attestationObject),
  });
}
