# ──────────────────────────────────────────────────────
# Terraform — Azure Static Web App Infrastructure
# ──────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
}

provider "azurerm" {
  features {}
}

# ── Variables ─────────────────────────────────────────

variable "project_name" {
  description = "Base name for all resources"
  type        = string
  default     = "collab-canvas"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Central India"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "sku_tier" {
  description = "Azure Static Web App pricing tier (Free or Standard)"
  type        = string
  default     = "Free"
}

# ── Resource Group ────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# ── Azure Static Web App ─────────────────────────────

resource "azurerm_static_web_app" "frontend" {
  name                = "swa-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_tier

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# ── Outputs ───────────────────────────────────────────

output "resource_group_name" {
  description = "Name of the Azure Resource Group"
  value       = azurerm_resource_group.main.name
}

output "static_web_app_name" {
  description = "Name of the Azure Static Web App"
  value       = azurerm_static_web_app.frontend.name
}

output "static_web_app_url" {
  description = "Default hostname of the Static Web App"
  value       = azurerm_static_web_app.frontend.default_host_name
}

output "static_web_app_api_key" {
  description = "API key for GitHub Actions deployment (sensitive)"
  value       = azurerm_static_web_app.frontend.api_key
  sensitive   = true
}
