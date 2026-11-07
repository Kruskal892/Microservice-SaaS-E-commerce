const swaggerAutogen = require('swagger-autogen');

const doc = {
  info: {
    title: 'Auth Service API',
    description:
      'Authentication, registration, email verification, and password recovery with expiring single-use reset authorization. Existing JWTs are not revoked by password reset; see endpoint descriptions.',
    version: '1.0.0',
  },
  host: 'localhost:6001',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
};

const outputFile = './swagger-output.json';
// Start at the app so mounted router prefixes are included in generated paths.
const endpointsFiles = ['./main.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then((result) => {
  if (!result?.success) {
    process.exitCode = 1;
  }
});
