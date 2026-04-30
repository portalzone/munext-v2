import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1a3a5c] text-white mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <span className="text-xl font-bold tracking-tight">MUNext</span>
            <p className="mt-3 text-blue-200 text-sm leading-relaxed">
              Connecting Memorial University students and alumni with employers across Newfoundland.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">Platform</h3>
            <ul className="space-y-2.5 text-sm text-blue-100">
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link>
              </li>
              <li>
                <Link href="/register?role=student" className="hover:text-white transition-colors">For Students</Link>
              </li>
              <li>
                <Link href="/register?role=alumni" className="hover:text-white transition-colors">For Alumni</Link>
              </li>
              <li>
                <Link href="/register?role=employer" className="hover:text-white transition-colors">For Employers</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm text-blue-100">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">Get in Touch</h3>
            <ul className="space-y-2.5 text-sm text-blue-100">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:support@basepan.com" className="hover:text-white transition-colors">support@basepan.com</a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Memorial University<br />St. John&apos;s, NL, Canada</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-blue-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-300">
          <p>© {year} MUNext. Memorial University of Newfoundland. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
