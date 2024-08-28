import semver from 'semver'
import colors from 'colors'
import pkg from '../../../package.json'
import { execSync } from 'child_process'
import { snapcliDebug } from '../prepare/debug'

async function checkForUpdate () {
  try {
    const latestVersion = execSync(`npm view ${pkg.name} version`).toString().trim()
    const currentVersion = pkg.version

    if (semver.gt(latestVersion, currentVersion)) {
      console.log(colors.green(`A new version of ${pkg.name} is available: ${latestVersion}`))
      console.log(colors.green('Updating...'))

      execSync(`npm install -g ${pkg.name}@latest`, { stdio: 'inherit' })

      console.log(colors.green(`${pkg.name} has been updated to version ${latestVersion}`))
    } else {
      console.log(colors.yellow(`${pkg.name} is already up to date (version ${currentVersion})`))
    }
  } catch (error) {
    console.log(colors.red(`Error checking for updates: ${(error as Error).message}`))
  }
}

export const updateCLI = async () => {
  snapcliDebug('updateCLI....')
  await checkForUpdate()
  process.exit(0)
}
