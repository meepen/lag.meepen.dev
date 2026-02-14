
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

  lifecycle {
    ignore_changes = [origin]
  }
}
