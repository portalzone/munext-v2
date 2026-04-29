import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex-1 bg-gray-50">

      {/* Hero */}
      <section className="bg-[#1a3a5c] text-white py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold leading-tight">
            Your career starts at MUN.
          </h1>
          <p className="mt-5 text-blue-200 text-lg leading-relaxed max-w-xl mx-auto">
            MUNext connects Memorial University students with employers across Newfoundland.
            Find jobs that match your skills, apply in one click.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-[#1a3a5c] px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="border border-blue-300 text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#15304d] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">🎓</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Students</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Build your profile, list your skills, and see how well you match each job before you apply.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Employers</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Post job openings, define required skills, and review applicants from MUN&apos;s talent pool.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Skill Matching</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Our skill matcher scores your fit for every job and shows you exactly what skills to build next.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} MUNext · Memorial University of Newfoundland
      </footer>

    </main>
  )
}
