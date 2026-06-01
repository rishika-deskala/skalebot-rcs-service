// newrelic.js
'use strict'
require('dotenv').config()

process.env.NEW_RELIC_APP_NAME = process.env.APP_NAME || 'nestjs-service';
module.exports = {
  app_name: [process.env.NEW_RELIC_APP_NAME ],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: { enabled: true },
  logging: { level: 'info' },
  application_logging: {
    forwarding: { enabled: true },      // ship app logs to NR (when agent sees stdout/stderr logs)
    metrics: { enabled: true },         // log volume/error metrics
    local_enrichment: { enabled: true } // add trace/span/linking metadata to each log line
  },
  labels : { 
    env: process.env.ENV || 'local',
    version: process.env.APP_VERSION || '1.0.0'
  }
}
