import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-[65vh] bg-[#f7faff] py-20">
      <div className="container-page mx-auto max-w-lg rounded-[28px] border border-[#e4ebf3] bg-white p-8 text-center shadow-travel">
        <h1 className="text-3xl font-black text-[#10243e]">Demo Login</h1>
        <p className="mt-3 text-sm leading-6 text-[#6d7c90]">The demo authentication UI is intentionally reserved for a later phase.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-[#ffd447] px-5 py-3 text-sm font-extrabold text-[#10243e]">Back to Home</Link>
      </div>
    </main>
  );
}
