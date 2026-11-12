declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
      readonly clientId: string;
    }
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
      readonly clientId: string;
    }
    class PayPalHttpClient {
      constructor(environment: LiveEnvironment | SandboxEnvironment);
      execute(request: { requestBody?: unknown; headers?: Record<string, string>; prefer?(v: string): void }): Promise<{
        statusCode: number;
        result: any;
      }>;
    }
  }
}

declare module '@paypal/checkout-server-sdk' {
  export namespace orders {
    class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: unknown): void;
      headers: Record<string, string>;
    }
    class OrdersGetRequest {
      constructor(id: string);
      headers: Record<string, string>;
    }
    class OrdersCaptureRequest {
      constructor(id: string);
      headers: Record<string, string>;
    }
  }
  export const orders: typeof import('@paypal/checkout-server-sdk')['orders'];
}
