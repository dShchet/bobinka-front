import {defineStore} from 'pinia';
import {getMe} from '~/utils/api';
import {ref} from 'vue';
import type UserInfoState from '~/interfaces/userInfoState';
import {type User} from '~/interfaces/user';
import {convertKeysToCamelCase} from '~/utils/converters';

export const useUserInfoStore = defineStore(
    'userinfo',
    (): UserInfoState => {
        const user = ref<UserInfoState['user']>(JSON.parse(localStorage.getItem('user') as string) || undefined);
        const isAuthenticated = ref<boolean>(localStorage.getItem('isAuthenticated') === 'true' || false);

        const get = async (update: any): Promise<User | any> => {
            if (update || user.value === undefined) {
                const response = await getMe();
                if (response.ok) {
                    user.value = convertKeysToCamelCase(await response.json());
                    isAuthenticated.value = true;
                    localStorage.setItem('user', JSON.stringify(user.value));
                    localStorage.setItem('isAuthenticated', 'true');
                } else {
                    localStorage.removeItem('user');
                    localStorage.removeItem('isAuthenticated');
                    return undefined;
                }
            }
            return user.value;
        }

        const clear = () => {
            user.value = undefined;
            isAuthenticated.value = false;
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
        };

        const username = () => {
            return user.value?.username;
        }

        const isSet = () => {
            return user.value !== undefined;
        }

        return {
            isSet,
            username,
            get,
            clear,
            isAuthenticated,
        };
    }
);
