import {type User} from "~/interfaces/user";
import {Ref} from "vue";

export default interface UserInfoState {
    user?: User,
    isAuthenticated: Ref<boolean>,
    isSet: () => boolean,
    username: () => string | undefined,
    clear: () => void,
    get: (update?: boolean) => Promise<User | undefined>,
};
