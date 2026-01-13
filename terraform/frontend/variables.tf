
variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "project_name" {
  description = "Name of the Cloudflare Pages project"
  type        = string
  default     = "lag-meepen-dev-frontend"
}

variable "github_owner" {
  description = "GitHub owner (user or organization)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "production_branch" {
  description = "Production branch name"
  type        = string
  default     = "main"
}

variable "custom_domain" {
  description = "Custom domain for the pages project (e.g., app.example.com). Leave empty to strictly use .pages.dev"
  type        = string
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the custom domain (required if custom_domain is set)"
  type        = string
  default     = ""
}

variable "api_base_url" {
  description = "Base URL for the API (e.g., https://api.example.com)"
  type        = string
}
