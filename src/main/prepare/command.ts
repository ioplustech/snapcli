import commander, { type Command } from 'commander'
import colors from 'colors'
import pkg from '../../../package.json'
import { runVoteService } from '../commands/runVoteService'
import { runLogin } from './login'
import { setLang } from '../commands/lang'
import { listWallets, activate } from '../commands/wallet'
import { setProxy } from '../commands/proxy'
import { checkBeforeAction } from './checker'
import { snapcliDebug } from './debug'
import { checkSpace } from '../checker'

const program = new commander.Command()

export async function register () {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    // .description('')
    .option('-d, --debug', 'show debug log', false)

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
    .command('login [privateKey]')
    .description(
      'login with proviteKey. Then your no need specify --privateKey any more'
    )
    .action(async (key, options, command) => {
      snapcliDebug('login with privateKey')
      // checkPrivateKey(key)
      await runLogin(key)
    })

  program
    .command('clean [item]')
    .description('clean local settings')
    .action((key, options, command) => {
      snapcliDebug('clean:', key, options)
      setLang(key)
    })

  program
    .command('listWallets')
    .description('list your saved wallets!')
    .action(async (key, options, command) => {
      snapcliDebug('listWallets:', key, options)
      await listWallets()
    })

  program
    .command('activate [address]')
    .description('activate wallet address')
    .action(async (key, options, command) => {
      snapcliDebug('activate:', key, options)
      await activate(key)
    })

  program
    .command('proxy [proxyUrl]')
    .description(
      'set proxy for request!'
    )
    .action((key, options, command) => {
      snapcliDebug('proxy:', key, options)
      setProxy(key)
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
