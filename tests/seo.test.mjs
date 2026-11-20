import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveMetaDescription, buildCmsStructuredData, safeCanonicalPath } from '../lib/seo/index.js';

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
