import styles from './privacy.module.css';

export const metadata = {
  title: 'Privacy policy | weareailabs',
  description: 'How eliv8Lyf handles weareailabs attendee and volunteer applications, photos, saved drafts and privacy requests.',
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return <div className={styles.page}>
    <header className={styles.header}><a href="/">weareailabs</a><a href="/register">Apply to attend →</a></header>
    <main className={styles.content} id="main-content">
      <p className={styles.eyebrow}>Your information</p>
      <h1>Privacy policy</h1>
      <p>Effective 14 November 2026 · Version 1.0</p>
      <p>weareailabs is an initiative of <a href="https://eliv8lyf.com">eliv8Lyf</a>. This policy explains how we handle information when you visit this website, apply to attend a workshop, apply to volunteer or contact us. For privacy questions and requests, email <a href="mailto:connect@eliv8lyf.com">connect@eliv8lyf.com</a>.</p>
      <section><h2>1. Information we collect</h2>
        <ul><li><strong>Attendee applications:</strong> your name, email, phone number, city and country, professional role, organisation, industry, experience, business function, AI experience, tools used and workshop build preferences.</li>
        <li><strong>Volunteer applications:</strong> your contact and location details, organisation or education, background, skills, tool proficiency, work examples and profile or repository links, role preferences, availability, commitments, relevant screening answers and a profile photo. Optional fields are marked in the form.</li>
        <li><strong>Application records:</strong> saved answers, application references, submission and update times, consent records, review notes and application status.</li>
        <li><strong>Technical and correspondence information:</strong> messages you send us and information needed to operate and protect the service, such as IP address, browser information, request times and error records processed by our hosting providers.</li></ul>
        <p>Please do not include passwords, government identity documents, financial account details or confidential information belonging to other people in free-text answers or work examples.</p>
      </section>
      <section><h2>2. Why we use it</h2><p>We use application information to assess suitability, plan workshop activities, review volunteer skills and photos, coordinate participation, communicate application updates, respond to requests and maintain the security and reliability of the service. The team may use application scores and review notes to support its assessment.</p><p>Submitting an application does not confirm a seat, volunteer selection or a payment. The current attendee application does not collect card details or take payment. If payment opens later, we will provide the relevant payment and refund information before asking you to pay.</p></section>
      <section><h2>3. Choice and consent</h2><p>The form asks for your agreement to the stated application purposes before submission. Required information is needed to process that application; you can leave optional questions blank. You can withdraw consent by contacting us, although this may prevent us from continuing your application or coordinating participation.</p><p>Application consent does not authorise publicity, advertising or use of your photo in marketing. We will seek separate permission for those uses. We do not sell application information or automatically add applicants to a marketing list. Any future-opportunity list will require a separate opt-in.</p></section>
      <section><h2>4. Photos and work examples</h2><p>Volunteer photos are processed and resized for upload, stored in private storage and made available through controlled access for application review and workshop identification. They are not intended as public profile images. Only upload your own photo and work examples you have permission to share. External portfolio and repository websites have their own privacy practices.</p></section>
      <section><h2>5. Saved drafts and browser storage</h2><p>The forms use your browser’s local storage to save draft answers, resume information and display preferences. Volunteer progress may also be saved on our servers before final submission so that you can resume the application. A shared device can expose a saved draft to other people who use that browser.</p><p>Use “Clear saved draft” in the form to remove its draft from that browser. This does not delete applications or photos already stored on our servers; email us to request that deletion. Browser copies remain until cleared by you, the browser or the application. We do not promise remote deletion of copies on devices we cannot access.</p></section>
      <section><h2>6. Who receives information</h2><p>Access is limited to the workshop team and service providers involved in operating the website and handling applications. Our current technical providers include Vercel for hosting and Supabase for database, authentication and file storage. Providers may process information outside your country according to their service arrangements; we do not promise India-only storage.</p><p>We may disclose information when required by applicable law, to respond to a valid legal request or to protect the service and the rights of applicants. We do not make application records available to sponsors for their independent marketing.</p></section>
      <section><h2>7. Retention and deletion</h2><p>Our operational retention schedule is:</p>
        <dl className={styles.retention}>
          <div><dt>Incomplete server-side applications</dt><dd>30 days after the last activity.</dd></div>
          <div><dt>Unsuccessful or withdrawn applications</dt><dd>90 days after the application is closed or withdrawn.</dd></div>
          <div><dt>Selected attendees and volunteers</dt><dd>Until 12 months after the relevant event.</dd></div>
          <div><dt>Separately opted-in future opportunities</dt><dd>12 months from opt-in, then renewed permission is required.</dd></div>
          <div><dt>Profile photos</dt><dd>Remove when the identification and review purpose is complete, unless needed for a continuing application or a specific legal requirement.</dd></div>
        </dl>
        <p>These periods guide the team’s retention reviews; deletion is not currently an automatic timer. Browser drafts are handled as described above. If an event is postponed or cancelled, we will review whether retaining an application still serves its purpose rather than retain it indefinitely.</p>
        <p>We may retain limited records longer where necessary for applicable legal, accounting, security or dispute-resolution requirements, with access restricted to those purposes. Removal from active systems may not immediately remove protected backup copies; those remain subject to the provider’s backup lifecycle and must not be reused for ordinary application processing. You can contact us for the status of a deletion request.</p>
      </section>
      <section><h2>8. Your requests and concerns</h2><p>Contact <a href="mailto:connect@eliv8lyf.com">connect@eliv8lyf.com</a> to request access to your application information, correction, withdrawal, deletion or to raise a privacy concern. Include the email address used for your application and, if available, its reference. Do not send identity documents unless we explain why they are needed. We may ask for proportionate verification to protect your information.</p><p>We will explain if a request cannot be fulfilled in full, including where a legal retention requirement applies. Clearing your browser draft does not withdraw your submitted application.</p></section>
      <section><h2>9. Security</h2><p>We use access controls, private photo storage and encrypted connections to reduce risks. No website or storage system can guarantee absolute security. If you believe your application or resume information has been exposed, contact us promptly and avoid sharing application access links or tokens.</p></section>
      <section><h2>10. Updates</h2><p>We will update this page when our practices change and show the effective date. Where a new purpose requires additional permission, updating this policy alone will not substitute for asking you.</p></section>
      <a className={styles.back} href="/register">Go to attendee application →</a>
    </main>
    <footer className={styles.footer}><a href="/">Home</a><a href="mailto:connect@eliv8lyf.com">Contact eliv8Lyf</a></footer>
  </div>;
}
