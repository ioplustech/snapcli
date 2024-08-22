import { appAuthPathKey, appEnvConfigPath, runtimeParams, supportLangList } from './../../constants/index'
import { generateKey, readHomeEnv, writeHomeEnv } from '../../utils'
import { appConfigPath } from '../../constants/index'
import { snapcliDebug } from './debug'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(appConfigPath, '.env') })

const { SNAPCLI_LANG } = process.env

if (SNAPCLI_LANG && supportLangList.includes(SNAPCLI_LANG)) {
  runtimeParams.setVar('SNAPCLI_LANG', SNAPCLI_LANG)
}
/**
 * OPEN_AI_KEY
 * SNAPCLI_LANG
 * ENGINE(MODEL)
 * LAST_VERSION_CHECK_TIME
 * ...
 */
const generateAuthKey = () => {
  let key = readHomeEnv(appAuthPathKey, appEnvConfigPath)
  if (key) {
    snapcliDebug(`${appAuthPathKey} already exists`)
    return
  }
  key = generateKey()
  writeHomeEnv(appAuthPathKey, key)
  snapcliDebug(`write ${appAuthPathKey}: succeed!`)
}

generateAuthKey()
