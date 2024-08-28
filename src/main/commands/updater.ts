import semver from 'semver'
import colors from 'colors'
import pkg from '../../../package.json'
import { execSync } from 'child_process'
import { snapcliDebug } from '../prepare/debug'
import { runProcess, spinnerStart } from '../../utils'
import type ora from 'ora'

let updateSpin: ora.Ora | undefined

async function checkForUpdate () {
  try {
    const latestVersion = execSync(`npm view ${pkg.name} version`).toString().trim()
    const currentVersion = pkg.version

    if (semver.gt(latestVersion, currentVersion)) {
      console.log(colors.green(`A new version of ${pkg.name} is available: ${latestVersion}`))
      updateSpin = spinnerStart(`start to update to ${latestVersion}...`)
      await runProcess('npm', ['i', '-g', `${pkg.name}@latest`], { stdio: 'ignore' })
      updateSpin.succeed(colors.green(`${pkg.name} has been updated to version ${latestVersion}`))
      // console.log(colors.green(`${pkg.name} has been updated to version ${latestVersion}`))
    } else {
      console.log(colors.yellow(`${pkg.name} is already up to date (version ${currentVersion})`))
    }
  } catch (error) {
    updateSpin?.clear()
    console.log(colors.red(`Error checking for updates: ${(error as Error).message}`))
  }
}

export const updateCLI = async () => {
  snapcliDebug('updateCLI....')
  await checkForUpdate()
  process.exit(0)
}
