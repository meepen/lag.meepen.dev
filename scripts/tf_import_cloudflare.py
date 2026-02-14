#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def cf_get_json(url: str, token: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def run_tofu(args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["tofu", "-chdir=terraform", *args],
        check=check,
        text=True,
        capture_output=True,
    )


def state_has(address: str) -> bool:
    result = run_tofu(["state", "list"], check=False)
    if result.returncode != 0:
        stderr = result.stderr.strip()
        if "No state file was found" in stderr:
            return False
        raise RuntimeError(result.stderr.strip() or "Failed to list terraform state")
    return address in result.stdout.splitlines()


def import_if_missing(address: str, import_id: str) -> None:
    if state_has(address):
        print(f"skip {address}: already in state")
        return
    result = run_tofu(["import", address, import_id], check=False)
    if result.returncode != 0:
        stderr = result.stderr.strip()
        raise RuntimeError(f"import failed for {address}: {stderr}")
    print(f"imported {address}")


def find_hyperdrive_id(account_id: str, token: str, name: str) -> str:
    data = cf_get_json(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/hyperdrive/configs",
        token,
    )
    for item in data.get("result", []):
        if item.get("name") == name:
            return item.get("id", "")
    return ""


def find_pages_domain_id(account_id: str, token: str, project: str, domain: str) -> str:
    data = cf_get_json(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project}/domains",
        token,
    )
    for item in data.get("result", []):
        if item.get("name") == domain:
            return item.get("id", "")
    return ""


def find_dns_record_id(zone_id: str, token: str, domain: str) -> str:
    query = urllib.parse.urlencode({"type": "CNAME", "name": domain})
    data = cf_get_json(
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?{query}",
        token,
    )
    result = data.get("result", [])
    if not result:
        return ""
    return result[0].get("id", "")


def main() -> int:
    try:
        init_result = run_tofu(["init", "-input=false"], check=False)
        if init_result.returncode != 0:
            raise RuntimeError(init_result.stderr.strip() or "Failed to initialize terraform")

        account_id = require_env("TF_VAR_cloudflare_account_id")
        zone_id = require_env("TF_VAR_cloudflare_zone_id")
        token = require_env("TF_VAR_cloudflare_api_token")
        project = os.getenv("TF_IMPORT_PAGES_PROJECT", "lag-meepen-dev-frontend")
        domain = os.getenv("TF_IMPORT_FRONTEND_DOMAIN", os.getenv("TF_VAR_frontend_domain", "lag.meepen.dev"))
        hyperdrive_name = os.getenv("TF_IMPORT_HYPERDRIVE_NAME", "api-workers-hyperdrive")

        hyperdrive_id = find_hyperdrive_id(account_id, token, hyperdrive_name)
        pages_domain_id = find_pages_domain_id(account_id, token, project, domain)
        dns_record_id = find_dns_record_id(zone_id, token, domain)

        if not hyperdrive_id:
            raise RuntimeError(f"Could not find Hyperdrive config '{hyperdrive_name}'")

        import_if_missing(
            "module.api.cloudflare_hyperdrive_config.api_db",
            f"{account_id}/{hyperdrive_id}",
        )

        import_if_missing(
            "module.frontend.cloudflare_pages_project.frontend",
            f"{account_id}/{project}",
        )

        if pages_domain_id:
            import_if_missing(
                "module.frontend.cloudflare_pages_domain.custom_domain[0]",
                f"{account_id}/{project}/{domain}",
            )
        else:
            print(f"skip module.frontend.cloudflare_pages_domain.custom_domain[0]: domain '{domain}' not found")

        if dns_record_id:
            import_if_missing(
                "module.frontend.cloudflare_record.frontend_cname[0]",
                f"{zone_id}/{dns_record_id}",
            )
        else:
            print(f"skip module.frontend.cloudflare_record.frontend_cname[0]: CNAME '{domain}' not found")

        print("terraform import completed")
        return 0
    except Exception as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
