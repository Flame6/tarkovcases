module.exports = {
  apps: [
    {
      name: 'tarkov-case-sorter',
      script: 'server.cjs',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5174
      }
    }
  ]
};

