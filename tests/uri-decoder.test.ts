import * as queryString from 'query-string';

test('the Expo Jest pipeline handles the patched ESM decoder without mocks', () => {
  expect(queryString.parse('name=Ol%C3%BA+Ada&tag=a&tag=b')).toEqual({
    name: 'Olú Ada',
    tag: ['a', 'b'],
  });
  expect(queryString.parse('bad=%C2&raw=%ZZ')).toEqual({
    bad: '\uFFFD',
    raw: '%ZZ',
  });
});
