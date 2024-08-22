import { register } from './prepare/command'
import { snapcliDebug } from './prepare/debug'
// import { checkVersion } from './prepare/version'

async function main () {
  // await checkVersion()
  await register()
}

main().catch((err) => {
  snapcliDebug((err as Error).message)
})
