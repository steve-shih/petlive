module.exports = {
  apps: [
    {
      name: 'petlive-frontend',
      script: 'server.js',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'petlive-backend',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        FLASK_ENV: 'production'
      }
    }
  ]
};
