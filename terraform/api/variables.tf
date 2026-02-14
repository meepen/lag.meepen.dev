
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

variable "domain" {
  description = "The domain for the worker"
  type        = string
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = string
}
