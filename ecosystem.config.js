module.exports = {
  apps: [{
    name: 'backend-server',
    script: 'backend/dist/server.js',
    cwd: './',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
