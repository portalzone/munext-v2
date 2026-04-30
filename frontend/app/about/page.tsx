import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us — MUNext',
  description: 'Learn about MUNext and our mission to connect MUN students with employers.',
}

export default function AboutPage() {
  return (
    <main className="flex-1 bg-gray-50">

      {/* Hero */}
      <section className="bg-[#1a3a5c] text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold">About MUNext</h1>
          <p className="mt-4 text-blue-200 text-lg leading-relaxed max-w-xl mx-auto">
            A platform built for the Memorial University community — connecting students, alumni, and employers in one place.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Mission */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              MUNext was built to solve a real problem: MUN students and alumni had no dedicated, modern platform to discover job opportunities from employers who specifically want to hire from Memorial University&apos;s talent pool. We bridge that gap — making it easier for students to launch their careers and for employers to find qualified, motivated candidates from one of Canada&apos;s leading universities.
            </p>
          </div>

          {/* What we do */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5">What We Do</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#1a3a5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Job Matching</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Our skill-matching algorithm scores your fit for every job posting, so you know exactly where to focus your energy.
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#1a3a5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Employer Tools</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Employers post roles, review applicants, track their hiring funnel, and communicate directly with candidates.
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[#1a3a5c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Career Insights</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Students see their profile strength, application success probability, and market trends powered by ML algorithms.
                </p>
              </div>

            </div>
          </div>

          {/* Who we serve */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Who We Serve</h2>
            <ul className="space-y-4">
              {[
                ['Current MUN Students', 'Discover internships, part-time roles, and graduate positions from employers who value a MUN education.'],
                ['MUN Alumni', 'Stay connected to the university\'s employer network long after graduation.'],
                ['Employers', 'Access a pool of vetted, skilled candidates from Memorial University across all disciplines.'],
              ].map(([role, desc]) => (
                <li key={role} className="flex gap-3 text-sm text-gray-600 leading-relaxed">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#1a3a5c] shrink-0 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span><strong className="text-gray-800">{role}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-[#1a3a5c] rounded-2xl px-8 py-10 text-center text-white">
            <h2 className="text-xl font-bold mb-2">Ready to get started?</h2>
            <p className="text-blue-200 text-sm mb-6">
              Join thousands of MUN students and employers already on the platform.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="bg-white text-[#1a3a5c] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                Create an account
              </Link>
              <Link
                href="/jobs"
                className="border border-blue-300 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#15304d] transition-colors"
              >
                Browse jobs
              </Link>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
