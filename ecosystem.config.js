require('dotenv').config();
module.exports = {
  apps: [
    {
      name: 'gateway',
      script: 'dist/run/index.js',

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      // args: 'one two',
      instances: 1,

      autorestart: true,
      watch: true,
      // max_memory_restart: '1G',
      env: {
        NODE_NAME: 'gateway'
      }
    },
    {
      name: 'customer-service',
      script: 'dist/run/index.js',
      args: 'one two',
      instances: 1,

      autorestart: true,
      watch: true,
      // max_memory_restart: '1G',
      env: {
        NODE_NAME: 'customer-service'
      }
    },
    {
      name: 'product-service',
      script: 'dist/run/index.js',
      // args: 'one two',
      instances: 1,

      autorestart: true,
      watch: true,
      // max_memory_restart: '1G',
      env: {
        NODE_NAME: 'product-service'
      }
    },
    {
      name: 'order-service',
      script: 'dist/run/index.js',
      // args: 'one two',
      instances: 1,

      autorestart: true,
      watch: true,
      env: {
        NODE_NAME: 'order-service'
      }
    }
  ]
};
