import {type Admin} from "~/interfaces/admin/admin.ts";
import {Ref} from "vue";

export default interface AdminInfoState {
    admin?: Admin,
    isAdminAuthenticated: Ref<boolean>,
    isSet: () => boolean,
    clear: () => void,
    get: (update?: boolean) => Promise<Admin | undefined>,
};
