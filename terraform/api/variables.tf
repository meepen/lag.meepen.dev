
variable "cloudflare_account_id" {
  description = "The Cloudflare Account ID"
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

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = string
}
