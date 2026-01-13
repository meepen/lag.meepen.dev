
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_hyperdrive_config" "api_db" {
  account_id = var.cloudflare_account_id
  name       = "api-workers-hyperdrive"
  origin = {
    database = var.postgres_db
    host     = var.postgres_host
    password = var.postgres_password
    port     = var.postgres_port
    scheme   = "postgres"
    user     = var.postgres_user
  }
}

resource "cloudflare_workers_script" "api_worker" {
  account_id = var.cloudflare_account_id
  name       = "api-workers"
  # This expects the worker to be built first. 
  # Run `pnpm run deploy` in `projects/api-workers/project` to generate dist/index.js
  content = file("../projects/api-workers/project/dist/index.js")
  module  = true

  compatibility_date  = "2024-02-08"
  compatibility_flags = ["nodejs_compat"]

  hyperdrive_config_binding {
    binding = "HYPERDRIVE"
    id      = cloudflare_hyperdrive_config.api_db.id
  }

  secret_text_binding {
    name = "API_SECRET"
    text = var.api_secret
  }

  plain_text_binding {
    name = "CORS_ORIGINS"
    text = var.cors_origins
  }
}

resource "cloudflare_workers_domain" "api_domain" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id
  
  hostname   = var.domain 
  service    = cloudflare_workers_script.api_worker.name
}
