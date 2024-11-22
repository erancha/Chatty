interface Config {
  REST_API_URL: string;
  WEBSOCKET_API_URL: string;
  BUILD: string;
  COGNITO: {
    userPoolId: string;
    userPoolWebClientId: string;
    region: string;
    domain: string;
    redirectSignIn: string;
    redirectSignOut: string;
  };
}

class ConfigService {
  private static instance: ConfigService;
  private config: Config | null = null;
  private loading: boolean = false;
  private loadingPromise: Promise<void> | null = null;
  private error: Error | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async loadConfig(): Promise<void> {
    // Return existing promise if loading is in progress
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Return immediately if config is already loaded
    if (this.config) {
      return Promise.resolve();
    }

    this.loading = true;
    this.loadingPromise = (async () => {
      try {
        const response = await fetch('/appConfig.json');
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.statusText}`);
        }

        // Validate config structure
        const data = await response.json();
        if (!data.WEBSOCKET_API_URL || !data.COGNITO) {
          throw new Error('Invalid config format: missing required properties');
        }

        this.config = data;
      } catch (err) {
        this.error = err instanceof Error ? err : new Error('Failed to load config');
        console.error('Config loading error:', this.error);
        throw this.error;
      } finally {
        this.loading = false;
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('Config not loaded. Please call loadConfig() first.');
    }
    return this.config;
  }

  getWebSocketBaseUrl(): string {
    if (!this.config) {
      throw new Error('Config not loaded. Please call loadConfig() first.');
    }
    return this.config.WEBSOCKET_API_URL;
  }

  isLoading(): boolean {
    return this.loading;
  }

  getError(): Error | null {
    return this.error;
  }
}

export const configService = ConfigService.getInstance();
