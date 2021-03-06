import * as vscode from "vscode";

import ICommand from "./ICommand";
import * as fileStore from "../store/fileStore";
import { OPEN_END_POINT } from "./constants";
import registerCommand from "./register";
import { BASE_URL } from "../constants";

export default class OpenEndPointCommand implements ICommand {
  command: string = OPEN_END_POINT;
  context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    registerCommand(context, this.command, false, this.execCommand.bind(this));
  }
  async execCommand() {
    const endpoint: string = fileStore.get(BASE_URL);
    vscode.env.openExternal(vscode.Uri.parse(endpoint));
  }
}
