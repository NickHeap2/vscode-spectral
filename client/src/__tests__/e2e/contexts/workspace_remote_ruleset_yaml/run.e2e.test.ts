/* eslint-disable require-jsdoc */

import { expect } from 'chai';
import * as chaiJestSnapshot from 'chai-jest-snapshot';
import * as vscode from 'vscode';
import * as path from 'path';

import { openFile, activate, setRulesetFile } from '../../helper';
import { workspace } from 'vscode';

import * as httpTestServers from 'http-test-servers';

const responseBody = `---
extends: 'spectral:oas'
rules:
  oas3-schema: hint
  info-contact: 'off'
`;

// const fetchMock = require('fetch-mock');

const routes = {
  spectralJs: {
    route: '/spectral.yaml',
    method: 'get',
    statusCode: 200,
    response: responseBody,
  },
};

const servers = {
  spectralJs: {
    port: 3006,
    delay: 1000,
  },
};
const testServers = httpTestServers(routes, servers);

suiteSetup(async () => {
  // fetchMock.get('https://dev.api.oneadvanced.io/rules/.spectral.js',
  //   responseBody,
  //   {
  //     status: 200,
  //   });
  await testServers.start(() => {
    console.log('Staring test servers on port 3006...');
  });
  chaiJestSnapshot.resetSnapshotRegistry();
  setRulesetFile('http://localhost:3006/spectral.yaml');

  await activate();
});

setup(function() {
  // eslint-disable-next-line no-invalid-this
  chaiJestSnapshot.configureUsingMochaContext(this);
});

suiteTeardown(async () => {
  await testServers.kill(() => {
    console.log('Test servers stopped.');
  });
});

suite('Workspace, remote ruleset yaml', () => {
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

    // console.error('Reading output channel...');
    // const channelId: vscode.Uri = await retrieveOutputChannelId();
    // const text = await readFromOutputChannelId(channelId);
    // console.error(text);
    // console.error('Read output channel');

    return vscode.languages.getDiagnostics(docUri);
  };
});
