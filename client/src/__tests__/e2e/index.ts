import * as path from 'path';
import { runTests, downloadAndUnzipVSCode } from 'vscode-test';
import { randomBytes } from 'crypto';

// The folder containing the Extension Manifest package.json
// Passed to `--extensionDevelopmentPath`
console.error(__dirname);
const extensionDevelopmentPath = path.resolve(__dirname, '../../../../dist');
console.info(`Loading extension from '${extensionDevelopmentPath}'`,);

interface TestCase {
  workspace?: string;
  testRunner: string;
}

const fetchMock = require('fetch-mock');

const responseBody = {
  functions: [
    "equalsCjs",
    "equalsEsm"
  ],
  rules: {
    'demand-newest-oas3': {
      given: "$.openapi",
      then: {
        function: "equalsCjs",
        functionOptions: {
          value: "3.1.0"
        }
      }
    },
    'valid-document-version': {
      given: "$.info.version",
      then: {
        function: "equalsEsm",
        functionOptions: {
          value: "2.0.0"
        }
      }
    }
  }
}

fetchMock.registerRoute([
  {
    name: 'session',
    matcher: 'https://dev.api.oneadvanced.io/rules/.spectral.js',
    response: {
      body: JSON.stringify(responseBody),
      // opts is as expected by https://github.com/bitinn/node-fetch/blob/master/lib/response.js
      // headers should be passed as an object literal (fetch-mock will convert it into a Headers instance)
      // status defaults to 200
      opts: {
        status: 200
      }
    }
  }]);

(async (): Promise<void> => {
  const testCases: TestCase[] = [
    // {
    //   testRunner: './contexts/no_workspace_no_ruleset/configuration',
    //   workspace: undefined,
    // },
    // {
    //   testRunner: './contexts/workspace_basic_ruleset/configuration',
    //   workspace: './workspaces/basic_ruleset/',
    // },
    // {
    //   testRunner: './contexts/workspace_basic_ruleset_with_functions/configuration',
    //   workspace: './workspaces/basic_ruleset_with_functions/',
    // },
    {
      testRunner: './contexts/workspace_remote_ruleset/configuration',
      workspace: './workspaces/remote_ruleset/',
    },
  ];

  try {
    const vscodeExecutablePath = await downloadAndUnzipVSCode('1.48.0');

    for (const tc of testCases) {
      console.info(`Using VSCode from '${vscodeExecutablePath}'`,);

      tc.testRunner = path.resolve(__dirname, tc.testRunner);
      console.info(`Using test runner from '${tc.testRunner}'`,);

      const launchArgs: string[] = [];

      if (tc.workspace !== undefined) {
        tc.workspace = path.resolve(__dirname, tc.workspace);
      } else {
        tc.workspace = `blank_${randomBytes(8).toString('hex')}`;
        const userDataDir = path.resolve(__dirname, './.vscode');
        console.info(`Using userDataDir '${userDataDir}'`)
        launchArgs.push('--user-data-dir');
        launchArgs.push(`${userDataDir}`);
      }

      launchArgs.push(tc.workspace);

      console.info(`Using workspace '${tc.workspace}'`,);

      launchArgs.push('--disable-extensions');

      console.info(`Using launchArgs: ${JSON.stringify(launchArgs)}`);

      // Download VS Code, unzip it and run the integration test
      await runTests({
        vscodeExecutablePath,
        extensionDevelopmentPath,
        extensionTestsPath: tc.testRunner,
        launchArgs,
      });
    }
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
})();
