import colors from 'colors'
import { appAuthPathKey, appEnvConfigPath } from '../../constants'
import { readHomeEnv } from '../../utils'
import { snapcliDebug } from './debug'
import { walletStorage } from '../service/wallet'

export const checkBeforeAction = async () => {
  const authKey = readHomeEnv(appAuthPathKey, appEnvConfigPath)
  if (!authKey) {
    snapcliDebug(`${authKey} not valid!`)
    return
  }
  const wallets = await walletStorage.getWallets()
  if (!wallets.length) {
    console.log(colors.red('[Error]: please load wallet(login) first or specify with --privateKey!'))
    process.exit(1)
  }
}
