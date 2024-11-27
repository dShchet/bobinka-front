import {defineStore} from 'pinia';
import {getAdminMe} from '~/utils/api';
import {ref} from 'vue';
import type AdminInfoState from '~/interfaces/admin/adminInfoState.ts';
import {type Admin} from '~/interfaces/admin/admin.ts';
import {convertKeysToCamelCase} from '~/utils/converters';

export const useAdminInfoStore = defineStore(
    'admininfo',
    (): AdminInfoState => {
        const admin = ref<AdminInfoState['admin']>(JSON.parse(localStorage.getItem('admin') as string) || undefined);
        const isAdminAuthenticated = ref<boolean>(localStorage.getItem('isAdminAuthenticated') === 'true' || false);

        const get = async (update: any): Promise<Admin | any> => {
            if (update || admin.value === undefined) {
                const response = await getAdminMe();
                if (response.ok) {
                    admin.value = convertKeysToCamelCase(await response.json());
                    isAdminAuthenticated.value = true;
                    localStorage.setItem('admin', JSON.stringify(admin.value));
                    localStorage.setItem('isAdminAuthenticated', 'true');
                } else {
                    localStorage.removeItem('admin');
                    localStorage.removeItem('isAdminAuthenticated');
                    return undefined;
                }
            }
            return admin.value;
        }

        const clear = () => {
            admin.value = undefined;
            isAdminAuthenticated.value = false;
            localStorage.removeItem('admin');
            localStorage.removeItem('isAdminAuthenticated');
        };

        const isSet = () => {
            return admin.value !== undefined;
        }

        return {
            isSet,
            get,
            clear,
            isAdminAuthenticated,
        };
    }
);
