import { Amplify } from '@aws-amplify/core';
import { configService } from '../services/ConfigService';

export const configureAmplify = async () => {
  try {
    // Ensure config is loaded first
    await configService.loadConfig();

    // Configure Amplify with Cognito settings
    const cognitoConfig = configService.getConfig().COGNITO;
    Amplify.configure({
      Auth: {
        Cognito: {
          loginWith: {
            oauth: {
              domain: cognitoConfig.domain,
              scopes: ['email', 'profile', 'openid'],
              redirectSignIn: [cognitoConfig.redirectSignIn],
              redirectSignOut: [cognitoConfig.redirectSignOut],
              responseType: 'code',
              providers: ['Google'],
            },
          },
          userPoolId: cognitoConfig.userPoolId,
          userPoolClientId: cognitoConfig.userPoolWebClientId,
          signUpVerificationMethod: 'code',
        },
      },
    });
  } catch (error) {
    console.error('Amplify configuration error', error);
  }
};
