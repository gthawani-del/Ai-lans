import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveMetaDescription, buildCmsStructuredData, inspectAeoSignals, inspectCmsContent, safeCanonicalPath } from '../lib/seo/index.js';

test('meta descriptions deterministically use visible page copy and stay concise', () => {
  const page = {
    pageTitle: 'AI workshops',
    sections: [
      { type: 'hero', visible: true, props: { heading: 'Build useful AI tools', body: 'A practical workshop for teams building with approved examples.' } },
      { type: 'rich_text', visible: false, props: { body: 'Hidden content must not appear.' } },
    ],
  };
  const first = deriveMetaDescription(page);
  assert.equal(first, deriveMetaDescription(page));
  assert.match(first, /Build useful AI tools/);
  assert.doesNotMatch(first, /Hidden content/);
  assert.ok(first.length <= 160);
});

test('meta description fallback uses the supplied page title without adding claims', () => {
  assert.equal(deriveMetaDescription({ pageTitle: 'Approved title', sections: [] }), 'Approved title');
});

test('canonical paths reject off-site and traversal paths', () => {
  assert.equal(safeCanonicalPath('//example.test/path', '/safe'), '/safe');
  assert.equal(safeCanonicalPath('/../private', '/safe'), '/safe');
  assert.equal(safeCanonicalPath('/privacy', '/'), '/privacy');
});

test('CMS structured data uses the page canonical consistently', () => {
  const data = buildCmsStructuredData({
    page: { slug: 'approved-copy', title: 'Approved title', template_id: 'standard_information' },
    revision: { seo: { canonical_path: '/approved-copy', meta_description: 'Approved description' }, document: { sections: [] } },
  });
  assert.equal(data['@graph'][0].url, 'https://weareailabs.com/approved-copy');
  assert.equal(data['@graph'][0].description, 'Approved description');
});

test('CMS SEO checks flag missing image alt text, skipped headings, and broken link syntax', () => {
  const checks = inspectCmsContent({
    pageTitle: 'Example',
    sections: [
      { type: 'image_text', props: { image_url: '/image.webp' } },
      { type: 'faq', props: { heading: '', items: [{ question: 'Question?', answer: 'Answer.' }] } },
      { type: 'cta', props: { label: 'Click here', href: 'javascript:alert(1)' } },
    ],
  });
  assert.equal(checks.imageIssues.length, 1);
  assert.equal(checks.headingIssues.length, 2);
  assert.equal(checks.linkIssues.length, 1);
  assert.ok(inspectAeoSignals({ pageTitle: 'Example', sections: [{ type: 'hero', props: { heading: 'Welcome', body: 'A clear introduction with enough useful detail.' } }] }).some(item => item.label === 'Heading levels follow a valid hierarchy'));
});

test('CMS SEO checks allow intentionally decorative images and descriptive internal links', () => {
  const checks = inspectCmsContent({
    pageTitle: 'Example',
    sections: [
      { type: 'image_text', props: { image_url: '/image.webp', alt: '' } },
      { type: 'hero', props: { heading: 'Welcome', cta_label: 'See details', cta_href: '/details' } },
      { type: 'faq', props: { heading: 'Questions', items: [{ question: 'What is this?', answer: 'A page.' }] } },
    ],
  });
  assert.equal(checks.imageIssues.length, 0);
  assert.equal(checks.headingIssues.length, 0);
  assert.equal(checks.linkIssues.length, 0);
  assert.deepEqual(checks.internalLinks.map(link => link.target), ['/details']);
});
