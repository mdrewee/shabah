module.exports = {
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS' } }] },
};
