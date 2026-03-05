module.exports = {
  apps: [{
    name: 'backend-server',
    script: './backend/src/server.ts',
    interpreter: 'node',
    watch: ['backend/src'],
    env: {
      NODE_ENV: 'development'
    }
  }, {
    name: 'frontend-dev',
    script: 'vite',
    cwd: './',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
