module.exports = {
  'src/**/*.{ts,tsx}': ['eslint --fix --max-warnings=50', 'prettier --write'],
  'test/**/*.{ts,tsx}': ['eslint --fix --max-warnings=50', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
