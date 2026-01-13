group "default" {
  targets = ["migrations", "api", "dataloader", "frontend"]
}

target "root-config" {
  context = "."
  # Only copy the files pnpm needs to resolve the workspace
  dockerfile-inline = "FROM alpine\nCOPY pnpm-lock.yaml pnpm-workspace.yaml /out/"
}

target "base-node" {
  context = "./base/node"

  contexts = {
    root-config = "target:root-config"
  }
}

target "migrations" {
  context = "./projects"
  dockerfile = "migrations/Dockerfile"
  tags = ["lag-meepen-dev/migrations:latest"]

  contexts = {
    base = "target:base-node"
  }
}

target "api" {
  context = "./projects"
  dockerfile = "api-workers/Dockerfile"
  tags = ["lag-meepen-dev/api:latest"]

  contexts = {
    base = "target:base-node"
  }
}

target "dataloader" {
  context = "./projects/dataloader"
  dockerfile = "Dockerfile"
  tags = ["lag-meepen-dev/dataloader:latest"]
}

target "frontend" {
  context = "./projects"
  dockerfile = "frontend/Dockerfile"
  secret = ["id=vite_env,src=.env"]
  tags = ["lag-meepen-dev/frontend:latest"]

  contexts = {
    base = "target:base-node"
  }
}