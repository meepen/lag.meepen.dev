{
  description = "lag.meepen.dev dev environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_22
            pkgs.bashInteractive
            pkgs.git
            pkgs.docker-compose
            pkgs.postgresql
            pkgs.jq
            pkgs.curl
            pkgs.mtr
            pkgs.opentofu
            pkgs.go-task
            pkgs.pnpm
          ];
        };
      }
    );
}
