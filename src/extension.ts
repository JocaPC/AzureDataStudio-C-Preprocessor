//
// Copyright (c) Jovan Popovic. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as compiler from 'c-preprocessor';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('run.preprocessor',
        async (context: azdata.ObjectExplorerContext) => {
            
            let connection = await azdata.connection.getCurrentConnection();
            if(connection == undefined) {
                vscode.window.showInformationMessage('Connect first...');
                return;
            }
            let connectionId = connection.connectionId;
            if (connection && connectionId) {

                let query = vscode.window.activeTextEditor.document.getText();

                compiler.compile(query, function(err: object, result: string) {

                    vscode.workspace.openTextDocument({language: 'sql', content: result}).then(doc => {

                    vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false).then(() => {

                            let filePath = doc.uri.toString();
                            azdata.queryeditor.connect(filePath, connectionId).then(
                                () => azdata.queryeditor.runQuery(filePath, undefined, false));
                        });

                    });
                });
            }
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {
}
