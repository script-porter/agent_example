declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    DEEPSEEK_API_URL: string;
    DEEPSEEK_API_KEY: string;
    LANGFUSE_SECRET_KEY: string;
    LANGFUSE_PUBLIC_KEY: string;
    LANGFUSE_BASE_URL: string;
    LANGFUSE_API_KEY: string;
  }
}
