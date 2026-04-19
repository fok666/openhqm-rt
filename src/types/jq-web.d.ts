declare module 'jq-web' {
  interface JQ {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jq-web operates on arbitrary JSON
    json(data: any, filter: string): Promise<any>;
  }

  export default function (): Promise<JQ>;
}
