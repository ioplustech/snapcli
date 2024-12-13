declare let process: {
  exit(arg0: number): unknown
  stdout: NodeJS.WritableStream
  stdin: NodeJS.ReadableStream
  env: {
    NODE_ENV: string
    OPEN_AI_KEY: string
    CHATY_LANG: string
    ENGINE: string
    WEB_PORT: string
    NODE_PORT: string
    LAST_VERSION_CHECK_TIME: string
  }
}
export type ChoiceAndReason = {
  reason: string;
  choice: number | number[]
}