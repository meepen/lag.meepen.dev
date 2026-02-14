terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

module "api" {
  source = "./api"

  cloudflare_account_id = var.cloudflare_account_id

  postgres_host     = var.postgres_host
  postgres_port     = var.postgres_port
  postgres_db       = var.postgres_db
  postgres_user     = var.postgres_user
  postgres_password = var.postgres_password
  cors_origins      = "https://${var.frontend_domain}"
}

module "frontend" {
  source = "./frontend"

  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id

  github_owner = var.github_owner
  github_repo  = var.github_repo
  
  api_base_url = "https://${var.api_domain}"
  
  custom_domain = var.frontend_domain
}
