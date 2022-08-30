/* eslint-disable require-jsdoc */

import { expect } from 'chai';
import * as chaiJestSnapshot from 'chai-jest-snapshot';
import * as vscode from 'vscode';
import * as path from 'path';

import { openFile, activate, retrieveOutputChannelId, readFromOutputChannelId } from '../../helper';
import { workspace } from 'vscode';

suiteSetup(async () => {
  chaiJestSnapshot.resetSnapshotRegistry();
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
