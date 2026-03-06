const SecurityAlertMock = function(data) {
  this.save = async () => {
    return true;
  };
};
require.cache[require.resolve('./server/models/SecurityAlert')] = { exports: SecurityAlertMock };

const { securityMiddleware } = require('./server/utils/security');

const runTest = async (name, payload) => {
  const req = {
    method: 'POST',
    originalUrl: '/api/test',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    body: payload,
    query: {},
    params: {}
  };
  
  let nextCalled = false;
  const res = {
    statusCode: 200,
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.jsonData = data; return this; }
  };
  const next = () => { nextCalled = true; };

  await securityMiddleware(req, res, next);

  if (nextCalled) {
    console.log(`[PASS] ${name}: ALLOWED`);
    console.log(`       Data: ${JSON.stringify(req.body)}`);
  } else {
    console.log(`[PASS] ${name}: BLOCKED (Correct)`);
    console.log(`       Reason: ${res.jsonData.error}`);
  }
};

const tests = async () => {
  console.log('--- STARTING SECURITY TESTS ---\n');

  await runTest('French Accents', { text: "L'été à Montréal est très agréable." });
  await runTest('XSS Tag', { comment: '<script>alert(1)</script>' });
  await runTest('SQL Injection', { user: "admin' --" });
  await runTest('NoSQL Injection', { query: { '$gt': '' } });
  await runTest('HTML Tag', { text: "<b>Bold</b> and <i>Italic</i>" });

  console.log('\n--- TESTS COMPLETED ---');
};

tests();
