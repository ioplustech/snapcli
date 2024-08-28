import os from 'os'
import path from 'path'
import { pkgName } from '../utils'

export const appName = pkgName
export const appEnvName = '.env'
export const appConfigDirName = '.snapcli'
export const appConfigLog = 'logs'
export const appConfigAuth = '.auth'
export const appConfigPath = path.resolve(os.homedir(), appConfigDirName)
export const appEnvConfigPath = path.resolve(appConfigPath, appEnvName)
export const appLogPath = path.resolve(appConfigPath, appConfigLog)
export const appAuthPath = path.resolve(appConfigPath, appConfigAuth)
export const appAuthPathKey = `${pkgName}_AUTH_KEY`

function getProperty<T, K extends keyof T> (obj: T, key: K): T[K] {
  return obj[key]
}
function setProperty<T, K extends keyof T> (obj: T, key: K, value: T[K]): void {
  obj[key] = value
}
export const runtimeParams = (() => {
  const obj: any = {}
  return {
    getVar (prop: keyof typeof obj) {
      return getProperty(obj, prop)
    },
    setVar (prop: keyof typeof obj, value: string) {
      setProperty(obj, prop, value)
    }
  }
})()

export const supportLangList = ['en', 'zh']
