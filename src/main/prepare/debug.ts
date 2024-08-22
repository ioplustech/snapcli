
import createDebug from 'debug'
import pkg from '../../../package.json'
import { argv } from './arg'

export const snapcliDebug = createDebug('chaty')
export let isDebug = false

if (argv.d || argv.debug || process.env.DEBUG) {
  isDebug = true
  snapcliDebug.enabled = true
}
snapcliDebug(`starting ${pkg.name} with arguments:`, argv)
