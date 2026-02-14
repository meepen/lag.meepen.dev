output "hyperdrive_id" {
  description = "Hyperdrive configuration ID for the API worker"
  value       = cloudflare_hyperdrive_config.api_db.id
}

output "cors_origins" {
  description = "Allowed CORS origins for the API worker"
  value       = var.cors_origins
}
