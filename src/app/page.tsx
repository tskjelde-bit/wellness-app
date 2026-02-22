import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex flex-col items-center gap-8 px-8 text-center">
        <h1 className="text-4xl font-black tracking-tighter text-gray-950 uppercase">
          Wellness & Sensory Connection Assistant
        </h1>
        <p className="max-w-md text-lg font-bold text-gray-500 uppercase tracking-widest">
          A voice-guided wellness experience for calm, presence, and connection.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-b from-gray-800 to-gray-950 px-8 py-3.5 font-bold text-white shadow-xl transition-all hover:scale-[1.05] active:scale-[0.95]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-xl border-2 border-gray-900 px-8 py-3.5 font-bold text-gray-900 transition-all hover:bg-gray-50 active:scale-[0.95]"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
