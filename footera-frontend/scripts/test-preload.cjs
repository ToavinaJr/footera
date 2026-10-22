const operatingSystem = require('node:os');
const path = require('node:path');
const nativeUserInfo = operatingSystem.userInfo.bind(operatingSystem);

const preloadPath = path.resolve(__dirname, 'test-preload.cjs');
if (!process.env.NODE_OPTIONS?.includes(preloadPath)) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --require=${preloadPath}`.trim();
}

operatingSystem.userInfo = (...args) => {
  try {
    return nativeUserInfo(...args);
  } catch {
    return { username: process.env.USERNAME || process.env.USER || 'footera-test' };
  }
};
