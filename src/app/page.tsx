import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream bg-[url('/bg.png')] bg-center bg-no-repeat bg-cover">
      <main className="flex flex-col items-center gap-8 px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Wellness & Sensory Connection Assistant
        </h1>
        <p className="max-w-md text-lg text-white/70">
          A voice-guided wellness experience for calm, presence, and connection.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-rose px-6 py-2.5 font-medium text-white transition-colors hover:bg-rose/90"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-rose px-6 py-2.5 font-medium text-rose transition-colors hover:bg-rose/5"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
