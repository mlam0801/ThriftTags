module.exports = {
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
};