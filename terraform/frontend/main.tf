resource "cloudflare_pages_project" "frontend" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = var.production_branch

  build_config {
    build_command   = "pnpm --filter=@lag.meepen.dev/frontend --filter=@lag.meepen.dev/api-schema build"
    destination_dir = "projects/frontend/project/dist"
    root_dir        = "."
  }

  source {
    type = "github"
    config {
      owner                         = var.github_owner
      repo_name                     = var.github_repo
      production_branch             = var.production_branch
      pr_comments_enabled           = true
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
      preview_branch_includes       = ["*"]
      preview_branch_excludes       = [var.production_branch]
    }
  }

  deployment_configs {
    production {
      environment_variables = {
        NODE_VERSION      = "22"
        PNPM_VERSION      = "10.26.1"
        VITE_API_BASE_URL = var.api_base_url
      }
    }
    preview {
      environment_variables = {
        NODE_VERSION      = "22"
        PNPM_VERSION      = "10.26.1"
        VITE_API_BASE_URL = var.api_base_url
      }
    }
  }
}

resource "cloudflare_pages_domain" "custom_domain" {
  count        = var.custom_domain != "" ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.frontend.name
  domain       = var.custom_domain
}

resource "cloudflare_record" "frontend_cname" {
  count   = var.custom_domain != "" && var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = var.custom_domain
  content = cloudflare_pages_project.frontend.subdomain
  type    = "CNAME"
  proxied = true
}
