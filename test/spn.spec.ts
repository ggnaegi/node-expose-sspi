import { sso, sysinfo } from '../index';
import assert from 'assert';

const a = assert.strict;

describe('SPN Unit Test', function () {
  const f = sso.getSPNFromURI;

  const msDomain = sysinfo.GetComputerNameEx('ComputerNameDnsDomain');
  console.log('msDomain: ', msDomain);

  it('should test localhost', async function () {
    a.equal(await f('http://localhost:3000'), 'HTTP/localhost');
  });
  it('should test 127.0.0.1', async function () {
    a.equal(await f('http://127.0.0.1:3000'), 'HTTP/localhost');
  });
  it('should test whatever', async function () {
    a.equal(await f('http://whatever:3000'), 'HTTP/whatever.' + msDomain);
  });
  it('should test ' + `http://whatever.${msDomain}:3000`, async function () {
    a.equal(
      await f(`http://whatever.${msDomain}:3000`),
      'HTTP/whatever.' + msDomain
    );
  });
  it('should test http://whatever.foo.bar:3000', async function () {
    a.equal(await f('http://whatever.foo.bar:3000'), 'HTTP/whatever.foo.bar');
  });
//   it('should test http://whatever.foo.bar:3000', async function () {
//     a.equal(await f('http:///whatever.foo.bar:3000'), 'HTTP/whatever.foo.bar');
//   });
});
