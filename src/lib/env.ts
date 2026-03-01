import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional().default("http://localhost:3000"),
  LLM_API_KEY: z.string().min(1),
  LLM_API_URL: z.string().url().optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  // CCBill payment integration (optional -- not needed for non-payment features)
  CCBILL_ACCOUNT_NUMBER: z.string().min(1).optional(),
  CCBILL_SUBACCOUNT: z.string().min(1).optional(),
  CCBILL_FLEXFORM_ID: z.string().min(1).optional(),
  CCBILL_SALT: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Missing or invalid environment variables:\n${formatted}\n\nSee .env.example for required variables.`
    );
  }

  return result.data;
}

let _env: Env | null = null;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!_env) {
      _env = validateEnv();
    }
    return _env[prop as keyof Env];
  },
});

export { envSchema };
