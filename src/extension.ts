//
// Copyright (c) Jovan Popovic. All rights reserved.
// Licensed under the GPLv2 license. See LICENSE file in the project root for full license information.
// Based on https://github.com/ParksProjets/C-Preprocessor developed by Guillaume Gonnet.

'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as compiler from 'c-preprocessor';

const predefinedMacroDefinitions = 
  "#define COUNTIF(condition) SUM(CASE WHEN condition THEN 1 ELSE 0 END) \n"
+ "#define SUMIF(column,condition)  SUM(CASE WHEN condition THEN column ELSE 0 END) \n"
+ "#define AVGIF(column,condition)  AVG(CASE WHEN condition THEN column END) \n"
+ "#define BIN(value,interval) (CAST((value/interval) AS INT) * interval) \n"
+ "#define PREV(column,offset)  LAG(column, offset, NULL) OVER (ORDER BY column) \n"
+ "#define NEXT(column,offset)  LEAD(column, offset, NULL) OVER (ORDER BY column) \n"
+ "#define PREVBY(column,offset,order)  LAG(column, offset, NULL) OVER (ORDER BY order) \n"
+ "#define NEXTBY(column,offset,order)  LEAD(column, offset, NULL) OVER (ORDER BY order) \n"
+ "#define PI 3.14 \n"
+ "#define MIN2(x,y) (case when x<y then x else y end) \n"
+ "#define MAX2(x,y) (case when x>y then x else y end) \n"
/* + "#define JSON(x) JSON_QUERY(x) \n"
+ "#define TINYINT(x) (CAST((x) AS TINYINT)) \n"
+ "#define SMALLINT(x) (CAST((x) AS SMALLINT)) \n"
+ "#define INT(x) (CAST((x) AS INT)) \n"
+ "#define BIGINT(x) (CAST((x) AS BIGINT)) \n"
+ "#define STRING(x) (CAST((x) AS NVARCHAR(MAX))) \n"
+ "#define STRING(x, size) (CAST((x) AS NVARCHAR(size))) \n"

+ "#define PREVBYON(column,offset,order,partition)  LAG(column, offset, NULL) OVER (PARTITION BY partition ORDER BY order) \n"
+ "#define NEXTBYON(column,offset,order,partition)  LEAD(column, offset, NULL) OVER (PARTITION BY partition ORDER BY order) \n"

+ "#define FOREACH(var, query, action) \\\n"
+ "DECLARE var_cursor CURSOR FOR query\\\n"
+ "OPEN var_cursor; \\\n"
+ "FETCH NEXT FROM var_cursor\\\n"
+ "    INTO @var;\\\n"
+ "WHILE @@FETCH_STATUS = 0 \\\n"
+ "BEGIN \\\n"
+ "    action\\\n"
+ "    FETCH NEXT FROM var_cursor\\\n"
+ "    INTO @var;\\\n"
+ "END \\\n"
+ "CLOSE var_cursor; \\\n"
+ "DEALLOCATE var_cursor;\n"
*/;

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
                let query = predefinedMacroDefinitions + " \n" + vscode.window.activeTextEditor.document.getText();
                compiler.compile(query, function(err: object, result: string) {

                    setText('------------------------------\n--\t\tExecuting query:\n------------------------------\n'+result);

                    let activeFilePath = vscode.window.activeTextEditor.document.uri.toString();
                    azdata.queryeditor.connect(activeFilePath, connectionId)
                        .then( 
                            () => {
                                azdata.queryeditor.runQuery(activeFilePath, undefined, false);                            
                            });
                });
            }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('run.preprocessor.new',

        async (context: azdata.ObjectExplorerContext) => {
            let connection = await azdata.connection.getCurrentConnection();
            if(connection == undefined) {
                vscode.window.showInformationMessage('Connect first...');
                return;
            }
            let connectionId = connection.connectionId;
            if (connection && connectionId) {
                let query = predefinedMacroDefinitions + " \n" + vscode.window.activeTextEditor.document.getText();
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
        })

    );

}

// this method is called when your extension is deactivated
export function deactivate() {
}
