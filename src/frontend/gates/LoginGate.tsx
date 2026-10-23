// @skipo:service kloks.service.auth
// @skipo:schema kloks.service.auth.ui@1.0.0
// @skipo:package @ultrst-armada/floks@^1.2.4
// @skipo:export ui
// @skipo:section Auth.ui.LoginSection
// @skipo:component AuthPage
// @skipo:origin GENERATED
import React from 'react';
import { AuthPage, type AuthResult } from '@ultrst-armada/floks/ui';
import { apiClient } from '../../libraries/client/apiClient';

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
        const data = await apiClient.login(email, password);
        return {
          success: Boolean(data?.success && data?.user),
          error: data?.error,
          user: data?.user,
          token: data?.token,
        };
      }}
      onRegister={async ({ name, email, password }) => {
        const data = await apiClient.register({ name, email, password });
        return {
          success: Boolean(data?.success && data?.user),
          error: data?.error,
          user: data?.user,
          token: data?.token,
        };
      }}
      onSuccess={onSuccess}
    />
  );
};
