output "api_hyperdrive_id" {
  description = "Hyperdrive configuration ID for API worker deploys"
  value       = module.api.hyperdrive_id
}

output "api_cors_origins" {
  description = "CORS origins value for API worker deploys"
  value       = module.api.cors_origins
}

output "api_worker_wrangler_deploy_toml" {
  description = "Rendered wrangler deploy config for the API worker"
  value = templatefile("${path.module}/templates/wrangler.deploy.toml.tftpl", {
    hyperdrive_id = module.api.hyperdrive_id
    cors_origins  = module.api.cors_origins
    api_domain    = var.api_domain
    zone_id       = var.cloudflare_zone_id
  })
}
