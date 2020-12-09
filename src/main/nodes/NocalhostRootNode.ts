import * as path from "path";
import * as vscode from "vscode";

import { getApplication } from "../api";
import { KUBE_CONFIG_DIR, USERINFO } from "../constants";
import { AppNode } from "./AppNode";
import { NocalhostAccountNode } from "./NocalhostAccountNode";
import { ROOT } from "./nodeContants";
import { BaseNocalhostNode } from "./types/nodeType";
import * as fileUtil from "../utils/fileUtil";
import * as fileStore from "../store/fileStore";

export class NocalhostRootNode implements BaseNocalhostNode {
  public label: string = "Nocalhost";
  public type = ROOT;
  constructor(public parent: BaseNocalhostNode | null) {}

  getParent(element: BaseNocalhostNode): BaseNocalhostNode | null | undefined {
    return;
  }

  async getChildren(
    parent?: BaseNocalhostNode
  ): Promise<Array<AppNode | NocalhostAccountNode>> {
    const res = await getApplication();
    let result: Array<AppNode | NocalhostAccountNode> = res.map((app) => {
      let context = app.context;
      let obj: {
        url?: string;
        name?: string;
        installType: string;
        resourceDir: Array<string>;
      } = {
        installType: "manifest",
        resourceDir: ["manifest/templates"],
      };
      if (context) {
        let jsonObj = JSON.parse(context);
        obj.url = jsonObj["application_url"];
        obj.name = jsonObj["application_name"];
        let originInstallType = jsonObj["install_type"];
        let source = jsonObj["source"];
        obj.installType = this.generateInstallType(source, originInstallType);
        obj.resourceDir = jsonObj["resource_dir"];
      }
      const filePath = path.resolve(
        KUBE_CONFIG_DIR,
        `${app.id}_${app.devspaceId}_config`
      );
      fileUtil.writeFile(filePath, app.kubeconfig);
      return new AppNode(
        this,
        obj.installType,
        obj.resourceDir,
        obj.name || `app${app.id}`,
        app.id,
        app.devspaceId,
        app.status,
        app.installStatus,
        app.kubeconfig,
        obj
      );
    });

    const userinfo = fileStore.get(USERINFO);

    if (result.length > 0) {
      result.unshift(new NocalhostAccountNode(this, `Hi, ${userinfo.name}`));
    }
    return result;
  }

  private generateInstallType(source: string, originInstallType: string) {
    let type = "helm-repo";

    if (source === "git" && originInstallType === "manifest") {
      type = "manifest";
    } else if (source === "git" && originInstallType === "helm_chart") {
      type = "helm";
    }
    return type;
  }

  getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem> {
    let treeItem = new vscode.TreeItem(
      this.label,
      vscode.TreeItemCollapsibleState.Expanded
    );
    return treeItem;
  }

  getNodeStateId(): string {
    return "Nocalhost";
  }
}