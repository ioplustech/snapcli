# @ioplus/snapcli 📸🖥️

[![npm version](https://badge.fury.io/js/%40ioplus%2Fsnapcli.svg)](https://badge.fury.io/js/%40ioplus%2Fsnapcli)
[![License: Apache](https://img.shields.io/badge/License-Apache-yellow.svg)](https://opensource.org/license/apache-1-1)

@ioplus/snapcli 是一个强大的命令行工具,专为 Snapshot 投票系统设计。轻松管理您的钱包、进行投票,让您的声音在去中心化治理中被听到! 🗳️💪

## 安装 🚀

使用 npm 全局安装 @ioplus/snapcli:

```bash
npm install -g @ioplus/snapcli
```

安装完成后,您可以使用 `snapcli` 或 `snap` 命令来运行工具。

## 使用方法 🛠️

```bash
$ snap
```

或

```bash
$ snapcli
```

### 命令概览

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
  update|u                             update snapcli
  help [command]                       display help for command
```

## 详细命令说明 📚

### login 🔐

```bash
$ snap login [privateKey]
```

安全地将您的私钥加密保存到本地。这样,您就不需要在每次操作时都指定 `--privateKey` 了。

### listWallets 👛

```bash
$ snap listWallets
```

显示您本地已保存的所有钱包地址,以及当前正在使用的钱包地址。

### use 🔄

```bash
$ snap use [address]
```

指定您想要使用的钱包地址。这对于管理多个钱包非常有用!

### vote 🗳️

```bash
$ snap vote [options] [space]
```

为指定的项目空间进行投票。例如: `snap vote aave.eth`

您可以在 [Snapshot](https://snapshot.org/#/) 上找到您感兴趣的项目空间。

### clean 🧹

```bash
$ snap clean [item]
```

(开发中) 用于在遇到错误时重置配置。

### proxy 🌐

```bash
$ snap proxy [proxyUrl]
```

(开发中) 设置请求代理,优化您的网络连接。

## 贡献 🤝

我们欢迎所有形式的贡献! 如果您有任何想法、建议或发现了 bug,请随时提出 issue 或提交 pull request。

## 许可证 📄

Apache

## 联系我们 📮

如果您有任何问题或需要支持,请通过 [GitHub Issues](https://github.com/yourusername/snapcli/issues) 与我们联系。

Happy voting! 🎉🚀