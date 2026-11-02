// @skipo:service kloks.service.auth
// @skipo:schema kloks.service.auth.ui@1.0.0
// @skipo:package @ultrst-armada/floks@^1.2.4
// @skipo:export ui
// @skipo:section Auth.ui.LoginSection
// @skipo:component AuthPage
// @skipo:origin GENERATED
import React from 'react';
import { AuthPage, type AuthResult } from '@ultrst-armada/floks/ui';
import { KultCanonicalAuthClient } from '../../libraries/client/canonicalAuthClient';

const authClient = new KultCanonicalAuthClient((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_SRKL_AUTH_BASE_URL || 'https://srkl-engine-mc96yqo08-dextro1n1laevo-1517.vercel.app');

export interface LoginGateProps {
  appName?: string;
  onSuccess: (result: AuthResult) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ appName = 'KULT ENGINE', onSuccess }) => {
  return (
    <AuthPage
      appName={appName}
      appSubtitle="APPLICATION COMPONENT FORGE"
      footerText="Ultrst Armada • Governed by Skipo"
      onLogin={async (email, password) => {
        const result = await authClient.signInEmail(email, password);
        return { success: result.success, error: result.error, user: result.user, token: result.token };
      }}
      onRegister={async ({ name, email, password }) => {
        const result = await authClient.signUpEmail(email, password, name);
        return { success: result.success, error: result.error, user: result.user, token: (result as typeof result & { token?: string }).token };
      }}
      onGoogleSignIn={async () => {
        const callbackURL = window.location.origin + '/?auth=google';
        const result = await authClient.signInGoogle(callbackURL);
        if (result.success && result.redirectUrl) window.location.assign(result.redirectUrl);
        return { success: result.success, error: result.error, redirectUrl: result.redirectUrl };
      }}
      onSuccess={onSuccess}
    />
  );
};
