//
// Copyright (c) Jovan Popovic. All rights reserved.
// Licensed under the GPLv2 license. See LICENSE file in the project root for full license information.
// Based on https://github.com/ParksProjets/C-Preprocessor developed by Guillaume Gonnet.

'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as compiler from 'c-preprocessor';

function setText(result: string) {
    const editor = vscode.window.activeTextEditor;
    editor.edit(builder => {
        const document = editor.document;
        const lastLine = document.lineAt(document.lineCount - 1);
        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
        builder.replace(new vscode.Range(start, end), result);
    });
}

class RollbackQueryChange implements azdata.queryeditor.QueryEventListener {
    query: string;
    constructor () { }
   
    setInitialText(query:string){
        this.query = query;
    }

    onQueryEvent(   type: azdata.queryeditor.QueryEventType,
                    document: azdata.queryeditor.QueryDocument): void {
                        
        if(type == 'queryStop' && this.query != null){
            vscode.window.showInformationMessage('Reverting to:'+this.query);
            setText(this.query); 
            this.query = null;   
        }
    }
}

const rollbacker: RollbackQueryChange = new RollbackQueryChange();

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('run.preprocessor',
        async () => {
            
            let connection = await azdata.connection.getCurrentConnection();
            if(connection == undefined) {
                vscode.window.showInformationMessage('Please connect to database...');
                return;
            }
            let connectionId = connection.connectionId;
            if (connection && connectionId) {

                rollbacker.setInitialText(vscode.window.activeTextEditor.document.getText());

                azdata.queryeditor.registerQueryEventListener(rollbacker);
                let query = vscode.window.activeTextEditor.document.getText();
                compiler.compile(query, function(err: object, result: string) {

                    vscode.window.showInformationMessage('Executing:'+result);
                    setText(result);

                    let activeFilePath = vscode.window.activeTextEditor.document.uri.toString();
                    azdata.queryeditor.connect(activeFilePath, connectionId)
                        .then( 
                            () => {
                                azdata.queryeditor.runQuery(activeFilePath, undefined, false);                            
                            });
                });
            }
    }));

}

// this method is called when your extension is deactivated
export function deactivate() {
}
