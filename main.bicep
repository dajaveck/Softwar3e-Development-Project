param staticSites_swa_fantasy_name string = 'swa-fantasy'

resource staticSites_swa_fantasy_name_resource 'Microsoft.Web/staticSites@2024-04-01' = {
  name: staticSites_swa_fantasy_name
  location: 'West Europe'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: 'https://dev.azure.com/jackDavey/Software Development Project/_git/Software Development Project'
    branch: 'new-main'
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'DevOps'
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

resource staticSites_swa_fantasy_name_default 'Microsoft.Web/staticSites/basicAuth@2024-04-01' = {
  parent: staticSites_swa_fantasy_name_resource
  name: 'default'
  location: 'West Europe'
  properties: {
    applicableEnvironmentsMode: 'SpecifiedEnvironments'
  }
}
