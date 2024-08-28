import { ensureDirSync, ensureFileSync } from 'fs-extra'
import { appLogPath, appConfigPath, appAuthPath, appEnvConfigPath } from '../../constants/index'
ensureDirSync(appConfigPath)
ensureDirSync(appLogPath)
ensureFileSync(appEnvConfigPath)
ensureFileSync(appAuthPath)
