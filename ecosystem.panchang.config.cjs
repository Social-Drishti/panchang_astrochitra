module.exports = {
  apps: [
    {
      name: 'panchang-app',
      cwd: '/var/www/astrochitra-app',
      script: '/usr/bin/serve',
      args: '-s dist -l 4200',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4200,
      },
      max_memory_restart: '300M',
      kill_timeout: 5000,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '5s',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/panchang-error.log',
      out_file: './logs/panchang-out.log',
      merge_logs: true,
    },
  ],
};