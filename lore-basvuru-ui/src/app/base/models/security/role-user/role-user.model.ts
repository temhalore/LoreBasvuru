// import { BaseModel } from "../../base.model";
// import { RoleModel } from "../role/role.model";
// import { UserModel } from "../user/user.model";

import { EtikKurulModel } from "../../definition-operations/etik-kurul.model";
import { BaseModel } from "../../general/base.model";
import { RoleModel } from "../role/role.model";
import { KisiModel } from "../user/kisi.model";

export class RoleUserModel extends BaseModel {
    roleDto:RoleModel;
    userDto :KisiModel;
    etikKurulDto :EtikKurulModel;
}
