import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const expoBin = path.resolve('node_modules/expo/bin/cli');
const expoHome = process.env.EXPO_HOME ?? '/tmp/snapbrain-expo-home';
const npmCache = process.env.NPM_CONFIG_CACHE ?? process.env.npm_config_cache ?? '/tmp/snapbrain-npm-cache';
const args = process.argv.slice(2);

mkdirSync(expoHome, { recursive: true });
mkdirSync(npmCache, { recursive: true });

const env = {
  ...process.env,
  EXPO_HOME: expoHome,
  NPM_CONFIG_CACHE: npmCache,
  npm_config_cache: npmCache,
};

if (!env.CI && args[0] === 'export') {
  env.CI = '1';
}

const child = spawn(process.execPath, [expoBin, ...args], {
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
