module.exports = {
  apps: [
    {
      name: "wedding-gpt",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/www/wwwroot/undangan.digyta.net",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
