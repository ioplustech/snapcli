import commander, { type Command } from 'commander'
import colors from 'colors'
import pkg from '../../../package.json'
import { runVoteService } from '../commands/runVoteService'
import { loginWithPrivateKey, loginWithKeystore } from './login'
import { cleanItem } from '../commands/clean'
import { listWallets, useWallet, delWallet } from '../commands/wallet'
import { updateCLI } from '../commands/updater'
// import { setProxy } from '../commands/proxy'
import { checkBeforeAction } from './checker'
import { snapcliDebug } from './debug'
import { checkSpace, checkClean } from '../checker'

const program = new commander.Command()

export async function register () {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    // .description('')
    .option('-d, --debug', 'show debug log', false)

  program
    .command('login [privateKey]')
    .description(
      'login with private key. Then your no need specify --privateKey any more'
    )
    .action(async (key, options, command) => {
      snapcliDebug('login with privateKey')
      // checkPrivateKey(key)
      await loginWithPrivateKey(key)
    })

  program
    .command('loginKeystore <keyStore> <password>')
    .description(
      'login with keystore. input your keyStore file path or keyStore json and password'
    )
    .action(async (keyStore, password) => {
      snapcliDebug('login with loginKeystore')
      // checkPrivateKey(key)
      console.log(keyStore, password)
      await loginWithKeystore(keyStore, password)
    })

  program
    .command('listWallets')
    .alias('list')
    .description('list your saved wallets and active wallet')
    .action(async (key, options, command) => {
      snapcliDebug('listWallets:', key, options)
      await listWallets()
    })

  program
    .command('use [address]')
    .description('use wallet address')
    .action(async (key, options, command) => {
      snapcliDebug('use:', key, options)
      await useWallet(key)
    })

  program
    .command('del [address]')
    .alias('delete')
    .description('delete wallet address')
    .action(async (key, options, command) => {
      snapcliDebug('use:', key, options)
      await delWallet(key)
    })

  program
    .command('vote [space]')
    .description('vote for specify space,like <aave.eth> You can find your spaces at https://snapshot.org/#/.')
    .option('-y, --yes', 'vote without confirm')
    .option('--refuse', 'refuse vote')
    .option('--accept', 'accept vote')
    .option('--privateKey <privateKey>', 'input your private key')
    .action(async (space: string, options, command: Command) => {
      snapcliDebug('run:', space, options)
      checkSpace(space)
      await checkBeforeAction()
      await runVoteService(space, options, command)
    })

  program
    .command('clean [item]')
    .description('clean local settings')
    .action((key, options, command) => {
      snapcliDebug('clean:', key, options)
      checkClean(key)
      cleanItem(key)
    })

  program
    .command('update')
    .alias('u')
    .description('update snapcli')
    .action(async (key, options, command) => {
      snapcliDebug('update cli')
      await updateCLI()
    })

  program.on('option:debug', () => {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
  })
  program.on('command:*', (obj: string[]) => {
    const availableCommands = program.commands.map((command) => command.name())
    if (!availableCommands.includes(obj[0])) {
      console.log(colors.red(`[Error]Unknown command: ${obj[0]}`))
      console.log()
      console.log(
        colors.green(`Available commands: ${availableCommands.join(',')}`)
      )
      process.exit(1)
    }
  })
  program.parse(process.argv)
  if (program.args.length < 1) {
    program.outputHelp()
    console.log()
  }
}
