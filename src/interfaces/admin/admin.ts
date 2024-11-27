import {User} from "~/interfaces/user.ts";

export interface Admin extends User {
    role: string,
}
