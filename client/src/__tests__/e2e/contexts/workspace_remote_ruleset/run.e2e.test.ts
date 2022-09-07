/* eslint-disable require-jsdoc */

import { expect } from 'chai';
import * as chaiJestSnapshot from 'chai-jest-snapshot';
import * as vscode from 'vscode';
import * as path from 'path';

//import * as sinon from 'sinon';

import { openFile, activate, setRulesetFile, retrieveOutputChannelId, readFromOutputChannelId } from '../../helper';
import { workspace } from 'vscode';

// import { fetch } from '@stoplight/spectral-runtime';

// const responseObject = {
//   functions: [
//     "equalsCjs",
//     "equalsEsm"
//   ],
//   rules: {
//     'demand-newest-oas3': {
//       given: "$.openapi",
//       then: {
//         function: "equalsCjs",
//         functionOptions: {
//           value: "3.1.0"
//         }
//       }
//     },
//     'valid-document-version': {
//       given: "$.info.version",
//       then: {
//         function: "equalsEsm",
//         functionOptions: {
//           value: "2.0.0"
//         }
//       }
//     }
//   }
// }
// //const fetch = sinon.stub();
// var mockedFetch = sinon.mock(fetch).expects('fetch')
// mockedFetch.returns(Promise.resolve(responseObject))

// // sinon.stub(fetch, 'Promise')
// //

suiteSetup(async () => {
  chaiJestSnapshot.resetSnapshotRegistry();
  setRulesetFile('https://dev.api.oneadvanced.io/rules/.spectral.js');

  await activate();
});

setup(function() {
  // eslint-disable-next-line no-invalid-this
  chaiJestSnapshot.configureUsingMochaContext(this);
});

suite('Workspace, remote ruleset', () => {
  suite('No diagnostics for empty files', () => {
    ['empty.yaml', 'empty.json'].forEach((fixture) => {
      test(`${fixture}`, async () => {
        const diags = await lint(['empty', fixture]);
        expect(diags).to.matchSnapshot();
      });
    });
  });

  suite('No diagnostics for valid files', () => {
    ['simple.yaml', 'simple.json'].forEach((fixture) => {
      test(`${fixture}`, async () => {
        const diags = await lint(['valid', fixture]);
        expect(diags).to.matchSnapshot();
      });
    });
  });

  suite('Invalid files trigger generation of diagnostics', () => {
    ['simple.yaml', 'simple.json'].forEach((fixture) => {
      test(`${fixture}`, async () => {
        const diags = await lint(['invalid', fixture]);

        expect(diags).to.matchSnapshot();
      });
    });
  });

  const lint = async (pathSegments: string[]) => {
    const docPath = path.resolve(workspace.rootPath as string, ...pathSegments);

    const docUri = vscode.Uri.file(docPath);
    await openFile(docUri);

    console.error('Reading output channel...');
    const channelId: vscode.Uri = await retrieveOutputChannelId();
    const text = await readFromOutputChannelId(channelId);
    console.error(text);
    console.error('Read output channel');

    return vscode.languages.getDiagnostics(docUri);
  };
});
