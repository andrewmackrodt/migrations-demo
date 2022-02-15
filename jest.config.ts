export default {
    collectCoverageFrom: [
        'src/**/*.ts',
    ],
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    preset: 'ts-jest',
    roots: [
        '<rootDir>/src',
    ],
    testEnvironment: 'node',
}