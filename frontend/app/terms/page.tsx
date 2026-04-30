import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — MUNext',
  description: 'Terms and conditions for using the MUNext platform.',
}

const LAST_UPDATED = 'April 30, 2026'

export default function TermsPage() {
  return (
    <main className="flex-1 bg-gray-50">

      {/* Hero */}
      <section className="bg-[#1a3a5c] text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold">Terms of Use</h1>
          <p className="mt-3 text-blue-200 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-10 text-gray-600 text-sm leading-relaxed">

            <div>
              <p>
                These Terms of Use govern your access to and use of MUNext, operated by the MUNext project team and available at{' '}
                <a href="https://munext.basepan.com" className="text-[#1a3a5c] hover:underline font-medium">munext.basepan.com</a>.
                By creating an account or using the platform, you agree to these terms. If you do not agree, do not use the platform.
              </p>
            </div>

            {[
              {
                title: '1. Eligibility',
                body: (
                  <p>
                    MUNext is intended for current students and alumni of Memorial University of Newfoundland, and for employers seeking to hire from the MUN community. By registering, you confirm that the information you provide is accurate. Misrepresenting your affiliation (e.g., registering as a student when you are not) may result in account suspension.
                  </p>
                ),
              },
              {
                title: '2. User Accounts',
                body: (
                  <>
                    <p>You are responsible for maintaining the confidentiality of your login credentials. You must not share your account or allow others to access it on your behalf. Notify us immediately at <a href="mailto:support@basepan.com" className="text-[#1a3a5c] hover:underline font-medium">support@basepan.com</a> if you suspect unauthorised access.</p>
                    <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these terms, without prior notice.</p>
                  </>
                ),
              },
              {
                title: '3. Acceptable Use',
                body: (
                  <>
                    <p>You agree not to:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1.5">
                      <li>Post false, misleading, or fraudulent job listings or applications</li>
                      <li>Harass, threaten, or abuse other users through messaging or any other feature</li>
                      <li>Attempt to access accounts, data, or systems you are not authorised to access</li>
                      <li>Use automated tools (bots, scrapers) to extract data from the platform</li>
                      <li>Upload malicious files or content through resumes, attachments, or any other upload</li>
                      <li>Use the platform for any purpose that violates applicable law</li>
                    </ul>
                  </>
                ),
              },
              {
                title: '4. Job Postings and Applications',
                body: (
                  <p>
                    Employers are solely responsible for the accuracy and legality of their job postings. MUNext does not verify job listings or guarantee employment outcomes. Students and alumni apply at their own discretion. MUNext is not a party to any employment agreement between users.
                  </p>
                ),
              },
              {
                title: '5. Messaging',
                body: (
                  <p>
                    The in-app messaging feature is provided to facilitate professional communication between applicants and employers. Messages must not contain spam, unsolicited advertising, or inappropriate content. MUNext reserves the right to review messages if a violation is reported.
                  </p>
                ),
              },
              {
                title: '6. Intellectual Property',
                body: (
                  <p>
                    The MUNext platform, including its design, code, and content, is the property of the MUNext project team. You may not copy, reproduce, or distribute any part of the platform without express written permission. You retain ownership of content you upload (resumes, cover letters), but grant MUNext a licence to store and display it to authorised users on the platform.
                  </p>
                ),
              },
              {
                title: '7. Disclaimers',
                body: (
                  <p>
                    MUNext is provided &quot;as is&quot; without warranty of any kind. We do not guarantee uninterrupted access or that the platform will be free of errors. We are not responsible for the conduct of any user or for any outcome resulting from use of the platform, including hiring decisions.
                  </p>
                ),
              },
              {
                title: '8. Limitation of Liability',
                body: (
                  <p>
                    To the fullest extent permitted by law, MUNext and its team shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, even if advised of the possibility of such damages.
                  </p>
                ),
              },
              {
                title: '9. Changes to These Terms',
                body: (
                  <p>
                    We may update these terms from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised terms. We will notify you of material changes via email or a notice on the platform.
                  </p>
                ),
              },
              {
                title: '10. Contact',
                body: (
                  <p>
                    Questions about these terms? Email us at{' '}
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
