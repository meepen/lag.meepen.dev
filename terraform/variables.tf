variable "cloudflare_api_token" {
  description = "The Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "The Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "The Cloudflare Zone ID"
  type        = string
}

variable "postgres_host" {
  type = string
}

variable "postgres_port" {
  type = string
}

variable "postgres_db" {
  type = string
}

variable "postgres_user" {
  type = string
}

variable "postgres_password" {
  type      = string
  sensitive = true
}

variable "github_owner" {
  description = "GitHub owner for the frontend repo"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo name for the frontend"
  type        = string
}

variable "api_domain" {
  description = "The domain for the API worker (without protocol or wildcard)"
  type        = string
}

variable "frontend_domain" {
  description = "The domain for the frontend application"
  type        = string
}
