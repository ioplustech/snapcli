import colors from 'colors'
import { removeSync } from 'fs-extra'
import { snapcliDebug } from '../prepare/debug'
import { appAuthPath } from '../../constants/index'

export const cleanItem = (item: string) => {
  switch (item) {
    case 'auth':
      snapcliDebug('start to clean auth');
      removeSync(appAuthPath);
      console.log(colors.green(`clean auth succeed!`));
      break;
    default:
      console.log(colors.yellow(`not support clean ${item}`))
  }
  process.exit(0);
}
