# @ioplus/snapcli 📸🖥️

[![npm version](https://badge.fury.io/js/%40ioplus%2Fsnapcli.svg)](https://badge.fury.io/js/%40ioplus%2Fsnapcli)
[![License: Apache](https://img.shields.io/badge/License-Apache-yellow.svg)](https://opensource.org/license/apache-1-1)

@ioplus/snapcli is a powerful command-line tool designed for the Snapshot voting system. Easily manage your wallets and cast votes, making your voice heard in decentralized governance! 🗳️💪

## Installation 🚀

Install @ioplus/snapcli globally using npm:

```bash
npm install -g @ioplus/snapcli
```

After installation, you can run the tool using either the `snapcli` or `snap` command.

## Usage 🛠️

```bash
$ snap
```

or

```bash
$ snapcli
```

### Command Overview

```
Usage: snapcli <command> [options]

Options:
  -V, --version                        output the version number
  -d, --debug                          show debug log (default: false)
  -h, --help                           display help for command

Commands:
  login [privateKey]                   login with private key. Then your no need specify --privateKey any more
  loginKeystore <keyStore> <password>  login with keystore. input your keyStore file path or keyStore json and password
  list|listWallets                     list your saved wallets and active wallet
  use [address]                        use wallet address
  del|delete [address]                 delete wallet address
  vote [options] [space]               vote for specify space,like <aave.eth> You can find your spaces at https://snapshot.org/#/.
  clean [item]                         clean local settings
  proxy [proxyUrl]                     set proxy for request
  help [command]                       display help for command

```

## Detailed Command Descriptions 📚

### login 🔐

```bash
$ snap login [privateKey]
```

Securely encrypt and save your private key locally. This eliminates the need to specify `--privateKey` for every operation.

### listWallets 👛

```bash
$ snap list|listWallets
```

Display all wallet addresses saved locally, as well as the currently active wallet address.

### use 🔄

```bash
$ snap use [address]
```

Specify the wallet address you want to use. This is particularly useful for managing multiple wallets!

### vote 🗳️

```bash
$ snap vote [options] [space]
```

Cast a vote for a specified project space. For example: `snap vote aave.eth`

You can find project spaces you're interested in on [Snapshot](https://snapshot.org/#/).

### clean 🧹

```bash
$ snap clean [item]
```

(In development) Used to reset configurations when encountering errors.

### proxy 🌐

```bash
$ snap proxy [proxyUrl]
```

(In development) Set up a request proxy to optimize your network connection.

## Contributing 🤝

We welcome all forms of contributions! If you have any ideas, suggestions, or have found a bug, please feel free to open an issue or submit a pull request.

## License 📄

Apache

## Contact Us 📮

If you have any questions or need support, please reach out to us through [GitHub Issues](https://github.com/yourusername/snapcli/issues).

Happy voting! 🎉🚀