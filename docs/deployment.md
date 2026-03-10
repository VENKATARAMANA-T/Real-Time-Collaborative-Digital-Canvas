# Deployment Flow Architecture
```mermaid
graph TD
    subgraph Cloud Infrastructure (Azure)
        RG[Resource Group] --> SWA[Azure Static Web App]
        RG --> ContainerApp[Azure Container Apps / App Service]
        SWA <-->|API Calls| ContainerApp
    end
    
    Terraform[Terraform (Infrastructure as Code)] -->|Provisions| RG
    
    GitHub[GitHub Actions] -->|Deploys Static Files| SWA
    GitHub -->|Deploys Container| ContainerApp
```
