declare module 'jq-web' {
  interface JQ {
    json(data: any, filter: string): Promise<any>;
  }

  export default function (): Promise<JQ>;
}
