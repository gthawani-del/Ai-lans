export const HOMEPAGE_DEFAULT_DOCUMENT = {
  version: 1,
  homepage: {
    navigation: { overview:'OVERVIEW', experience:'EXPERIENCE', details:'DETAILS', faq:'FAQ', apply:'APPLY TO ATTEND', privacy:'Privacy policy' },
    brand: { presenting: 'PRESENTS', name: 'ELIV8 LYF' },
    hero: {
      headingLineOne: 'Stop learning about AI.', headingLineTwoLead: 'Start ', headingAccent: 'building', headingLineTwoEnd: ' with it.',
      logoAlt: 'weareailabs — Explore, Learn, Create Together',
      description: 'A hands-on AI business workshop where founders, CXOs and business leaders turn real business problems into working AI solutions.',
      location: 'MUMBAI', availability: 'COMING SOON', primaryCta: 'Apply to attend', secondaryCta: 'Dates & venue',
      mediaAlt: 'Business leaders collaborating around a laptop during a workshop', posterAlt: 'Business leaders collaborating around a laptop during a workshop',
      source: { type: 'image', asset_id: null, url: '/images/ai-lab/workshop-teal.webp', video_id: '', poster_asset_id: null, poster_url: '/images/ai-lab/workshop-teal.webp' },
      mediaHeading: 'THE WORKSHOP EXPERIENCE', mediaSubheading: 'Hands-on. Practical. Built for business.',
      mediaEyebrow: 'HANDS-ON LEARNING', mediaTitle: 'From problem to working MVP', mediaCaption: 'See how the lab moves from business problem to working MVP.'
    },
    transformation: {
      headingFirst: 'THIS IS NOT', headingSecond: 'AN AI COURSE.',
      introLineOne: 'You don’t just watch slides.', introLineTwo: 'You work. You build.', introEmphasis: 'You do not need to be a developer.',
      problemHeading: 'BUSINESS PROBLEM', problemItems: ['Siloed data','Manual work','Slow decisions','Missed opportunities'],
      problemAlt: 'A professional seated at a laptop, thinking with a hand on his cheek',
      mvpHeading: 'WORKING MVP', mvpItems: ['Real solution','Measurable impact','Faster decisions','Business value'],
      mvpAlt: 'Laptop showing a dashboard with charts and data'
    },
    details: {
      eyebrow: 'THE PRACTICAL DETAILS', heading: 'Before you apply',
      intro: 'Know what is planned, what you will work on and which arrangements are still being confirmed.',
      items: [
        { title:'Format', body:'Two-day, in-person workshop in Mumbai. Dates, venue and daily hours are to be confirmed.' },
        { title:'Build focus', body:'Work on a real business problem and aim for a usable AI prototype (MVP), with a practical next-step plan. The exact scope depends on the problem and available resources.' },
        { title:'How you build', body:'Individual versus team-based working arrangements and participant-to-facilitator ratio will be confirmed before the event.' },
        { title:'What to bring', body:'Device requirements, workshop accounts and any paid AI-tool subscriptions will be clarified before attendance is finalized. Do not purchase subscriptions solely to apply.' },
        { title:'Fees and logistics', body:'The workshop fee is ₹25,000 per participant. Payment timing, taxes (if applicable), and travel, accommodation, food and parking arrangements will be clarified before payment. Applying requires no payment.' },
        { title:'Application process', body:'Applications are reviewed. Submission does not guarantee a place; the team will communicate selection, schedule and payment instructions separately.' }
      ], cta: 'Apply for the workshop'
    },
    faqHeading: 'FAQ', faqs: [
      { question:'Who should attend?', answer:'Founders, CXOs, business owners, senior professionals and independent professionals who want to use AI on practical business problems.' },
      { question:'Do I need to know how to code?', answer:'No. Coding experience is not required. The application asks about your current AI familiarity so the team can plan support.' },
      { question:'What will I build?', answer:'You’ll work toward a practical AI prototype addressing a business workflow. The exact prototype is determined by your problem, usable information and the workshop’s confirmed setup. A production-ready product is not guaranteed.' },
      { question:'Do I need a business idea already?', answer:'You should be able to describe a process or problem you would like to improve. You do not need a finished solution or technical specification.' },
      { question:'What data or systems can I use?', answer:'Examples include spreadsheets, PDFs, emails or CRM workflows. Do not share confidential company data in the application; only use representative information you are permitted to use.' },
      { question:'Is my idea confidential?', answer:'Application information is used for workshop review and preparation and is handled as described in our privacy policy. Do not submit passwords, private client data or confidential files. Specific workshop confidentiality arrangements will be communicated before participation.' },
      { question:'How much time is required, and will I work alone?', answer:'It is a two-day, in-person workshop in Mumbai. Daily hours, individual or group format and the facilitator ratio are pending confirmation.' },
      { question:'Do I need a laptop or paid AI subscriptions?', answer:'Equipment and tool requirements are not finalized. Please do not buy subscriptions to apply. Requirements will be shared with selected applicants in advance.' },
      { question:'Is there a fee? Are travel and meals included?', answer:'The workshop fee is ₹25,000 per participant. Payment and refund terms, taxes (if applicable), travel, accommodation, meals and parking arrangements will be communicated before payment. This application does not collect payment.' },
      { question:'When and where? What happens after I apply?', answer:'Mumbai, India. Dates, venue and daily hours will be announced. The team reviews applications and contacts applicants with the next steps. Applying does not confirm a place.' }
    ],
    closing: { headingFirst:'WEAREAILABS IS COMING', headingSecond:'TO MUMBAI.', body:'Dates and venue will be announced here.', note:'You can apply now; a place is not confirmed by applying.', status:'We will share the confirmed schedule and next steps separately.', imageAlt:'Gateway of India in morning light, Mumbai' },
    footer: { copyright:'© 2026 weareailabs. All rights reserved.' }
  }
};

export const HOMEPAGE_DEFAULT_SEO = {
  seo_title: 'weareailabs | Practical AI Workshops & Learning',
  meta_description: 'Explore practical AI workshops with weareailabs. Learn by building, discover useful AI tools and connect with people creating real-world projects.',
  canonical_path: '/', indexable: true, follow_links: true,
  og_title: 'weareailabs | Practical AI Workshops & Learning',
  og_description: 'Stop learning about AI. Start building with it. Mumbai — dates to be announced.',
  og_image_asset_id: 'brand_home', og_image_url: '', social_image_alt: 'weareailabs — Explore Learn Create Together',
  og_type: 'website', locale: 'en-IN', structured_data_type: 'WebPage'
};

export function homepageMetaDescription(home = HOMEPAGE_DEFAULT_DOCUMENT.homepage) {
  const text = [home.hero.description, home.details.intro, ...home.details.items.map(item => item.body)].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  if (text.length <= 160) return text;
  const clipped=text.slice(0,160), boundary=clipped.lastIndexOf(' ');
  return (boundary>100?clipped.slice(0,boundary):clipped).replace(/[\s.,;:!?-]+$/,'')+'…';
}
