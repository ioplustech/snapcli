import { appEnvConfigPath } from './../../constants/index'
import { fetchApiWithTimeout, readHomeEnv, writeHomeEnv } from '../../utils/index'
import { snapcliDebug } from './debug'
import boxen from 'boxen'
import colors from 'colors'
import semver from 'semver'
import os from 'os'
import path from 'path'
import dotenv from 'dotenv'
import fse from 'fs-extra'

import pkg from '../../../package.json'
import { isValidUrl } from '../../utils'

const homedir = os.homedir()
const npmrc = path.resolve(homedir, '.npmrc')
const projectName = 'snapcli'
let npmRegistry = 'https://registry.npmjs.org/'
const cnRegistry = 'https://registry.npmmirror.com/'
const cnRegExp = /registry\.npmmirror\.com|registry\.npm\.taobao\.org/im
const LAST_VERSION_CHECK = 'LAST_VERSION_CHECK'
function getRegistry () {
  if (fse.existsSync(npmrc)) {
    const content = fse.readFileSync(npmrc, 'utf8')
    const envConfig = dotenv.parse(content)
    // skip private npm registry
    if (isValidUrl(envConfig.registry) && cnRegExp.test(envConfig.registry)) {
      npmRegistry = cnRegistry
      snapcliDebug(`use registry: ${envConfig.registry}`)
    }
  }
}
getRegistry()
function formatTime (timestamp: string | undefined) {
  let t = 0
  if (!timestamp) return t
  try {
    const ti = new Date(Number(timestamp)).toString()
    snapcliDebug(`formatTime ${timestamp}, ${ti}`)
    t = Number(timestamp)
  } catch (_) { }
  return t
}
function isNeedCheck (lastTime: number) {
  if (!lastTime) return true
  const now = Date.now()
  if ((now - lastTime) < (1e3 * 60 * 60 * 24 * 7)) {
    snapcliDebug('lastTime already checked!')
    return false
  }
  return true
}
export async function checkVersion () {
  try {
    const lastUpdate = formatTime(readHomeEnv(LAST_VERSION_CHECK, appEnvConfigPath))
    const needCheck = isNeedCheck(lastUpdate)
    if (!needCheck) return
    snapcliDebug('checkVersion...')
    writeHomeEnv(LAST_VERSION_CHECK, String(Date.now()))
    snapcliDebug(`write home .env ${LAST_VERSION_CHECK}, ${Date.now()} succeed!`)
    const fullUrl = new URL(`${projectName}/latest`, npmRegistry).toString()
    const data = await fetchApiWithTimeout(fullUrl, 'POST', undefined, undefined, 2.5 * 1e3)
    if (data === 'timeout') {
      snapcliDebug('fetchApiWithTimeout timeout')
      return
    }
    const { version: latest } = data as any
    snapcliDebug(pkg.version, latest)
    if (semver.valid(latest) && semver.valid(pkg.version)) {
      if (semver.gt(latest, pkg.version)) {
        console.log(colors.green(`chaty latest version: ${latest as string}`))
        console.log(colors.red(`local version: ${pkg.version}`))
        console.log(boxen('please install the latest version with: npm i -g snapcli', { padding: 1 }))
      }
    }
  } catch (err) {
    snapcliDebug((err as Error).message)
  }
}
