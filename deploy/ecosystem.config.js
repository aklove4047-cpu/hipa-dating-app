module.exports = {
  apps: [
    {
      name: 'hipa-dating-server',
      script: 'src/server.js',
      cwd: '/var/www/hipa/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
