import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — MUNext',
  description: 'How MUNext collects, uses, and protects your personal information.',
}

const LAST_UPDATED = 'April 30, 2026'

export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-gray-50">

      {/* Hero */}
      <section className="bg-[#1a3a5c] text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-3 text-blue-200 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto prose prose-gray prose-sm max-w-none">
          <div className="space-y-10 text-gray-600 text-sm leading-relaxed">

            <div>
              <p>
                MUNext (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the platform available at{' '}
                <a href="https://munext.basepan.com" className="text-[#1a3a5c] hover:underline font-medium">munext.basepan.com</a>.
                This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.
                By using MUNext, you agree to the practices described here.
              </p>
            </div>

            {[
              {
                title: '1. Information We Collect',
                body: (
                  <>
                    <p><strong className="text-gray-800">Account information:</strong> When you register, we collect your name, email address, and password (hashed). Employers additionally provide a company name and industry.</p>
                    <p className="mt-2"><strong className="text-gray-800">Profile information:</strong> Students may optionally provide their program, GPA, graduation year, skills, and resume. This information is used to match you with relevant job postings.</p>
                    <p className="mt-2"><strong className="text-gray-800">Usage data:</strong> We log actions you take on the platform (e.g., applications submitted, jobs posted) for security, analytics, and audit purposes via Spatie Activity Log.</p>
                    <p className="mt-2"><strong className="text-gray-800">Messages:</strong> Messages sent between applicants and employers are stored in our database to enable conversation history. Attachments are stored on our server.</p>
                  </>
                ),
              },
              {
                title: '2. How We Use Your Information',
                body: (
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>To create and manage your account</li>
                    <li>To match students and alumni with relevant job postings</li>
                    <li>To enable employers to review and communicate with applicants</li>
                    <li>To send transactional email notifications (application updates, messages)</li>
                    <li>To generate aggregated, anonymised analytics for the platform</li>
                    <li>To detect and prevent fraud or abuse</li>
                  </ul>
                ),
              },
              {
                title: '3. Information Sharing',
                body: (
                  <p>
                    We do not sell your personal information. We do not share your data with third parties except: (a) with employers when you apply to their job postings, (b) with service providers who operate the infrastructure this platform runs on, and (c) when required by law.
                    Your resume is only accessible to employers for jobs you have applied to.
                  </p>
                ),
              },
              {
                title: '4. Data Retention',
                body: (
                  <p>
                    We retain your account data for as long as your account is active. If you delete your account, your personal information is removed within 30 days. Application records may be retained in anonymised form for platform analytics.
                  </p>
                ),
              },
              {
                title: '5. Security',
                body: (
                  <p>
                    Passwords are hashed using bcrypt and never stored in plain text. All data is transmitted over HTTPS. Access to production data is restricted to authorised personnel only. While we take reasonable precautions, no system is completely secure — please use a strong, unique password.
                  </p>
                ),
              },
              {
                title: '6. Your Rights',
                body: (
                  <>
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>Access the personal information we hold about you</li>
                      <li>Correct inaccurate information through your profile settings</li>
                      <li>Request deletion of your account and associated data</li>
                      <li>Withdraw consent for optional data uses</li>
                    </ul>
                    <p className="mt-2">To exercise these rights, email us at <a href="mailto:support@basepan.com" className="text-[#1a3a5c] hover:underline font-medium">support@basepan.com</a>.</p>
                  </>
                ),
              },
              {
                title: '7. Changes to This Policy',
                body: (
                  <p>
                    We may update this policy from time to time. If we make material changes, we will notify you via email or a prominent notice on the platform before the change takes effect.
                  </p>
                ),
              },
              {
                title: '8. Contact',
                body: (
                  <p>
                    Questions about this policy? Contact us at{' '}
                    <a href="mailto:support@basepan.com" className="text-[#1a3a5c] hover:underline font-medium">support@basepan.com</a>{' '}
                    or visit our <a href="/contact" className="text-[#1a3a5c] hover:underline font-medium">Contact page</a>.
                  </p>
                ),
              },
            ].map(({ title, body }) => (
              <div key={title}>
                <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
                {body}
              </div>
            ))}

          </div>
        </div>
      </section>
    </main>
  )
}
