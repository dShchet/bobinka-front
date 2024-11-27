<script lang="ts" setup>
import {onMounted, ref} from "vue";
import {useWebAppTheme} from "vue-tg";
import {useEULAStore} from "~/stores/eula.ts";
import {useCookiesStore} from "~/stores/cookies.ts";
import {getUserEULAChoice, setUserEULAChoice} from "~/utils/api.ts";
import {convertKeysToCamelCase} from "~/utils/converters.ts";
import {useUserInfoStore} from "~/stores/userInfo.ts";
import {storeToRefs} from "pinia";

// Common section
const {themeParams} = useWebAppTheme();

// Stores section
const EULAStore = useEULAStore();
const cookiesStore = useCookiesStore();

const userInfoStore = useUserInfoStore();
const {isAuthenticated} = storeToRefs(userInfoStore);

// Dialog section
const showMainDialog = ref<boolean>(cookiesStore.getCookie('bobinka_eula_accepted') !== 'true');
const localIsChoiceRemembered = ref<boolean>(false);

// Panel section
const showPanel = ref<boolean>(false);

// Actions section
const onAccept = async () => {
    if (!isAuthenticated.value) {
        if (localIsChoiceRemembered.value) {
            EULAStore.rememberChoice();
            cookiesStore.setCookie('bobinka_eula_accepted', 'true', 7);
        } else {
            EULAStore.forgetChoice();
            cookiesStore.setCookie('bobinka_eula_accepted', 'true', 1);
        }
    } else {
        const response = await setUserEULAChoice(localIsChoiceRemembered.value);
        if (response.ok) {
            if (localIsChoiceRemembered.value) {
                EULAStore.rememberChoice();
            } else {
                EULAStore.forgetChoice();
            }
        } else {
            console.error(response);
        }
    }
    showMainDialog.value = false;
};

onMounted(async () => {
    if (isAuthenticated.value) {
        setTimeout(async () => {
            const response = await getUserEULAChoice();
            if (response.ok) {
                const result = convertKeysToCamelCase(await response.json()) as { isEulaChoiceRemembered: boolean };
                localIsChoiceRemembered.value = result.isEulaChoiceRemembered;
                if (localIsChoiceRemembered.value) {
                    await onAccept();
                }
            } else {
                console.error(response);
            }
        }, 100);
    }
});
</script>

<template>
    <v-dialog
        v-model="showMainDialog"
        :persistent="true"
        :scrollable="true"
        max-width="800px"
    >
        <v-card>
            <v-card-text>
                <b class="text-center">Пользовательское соглашение</b><br><br>

                У нас Вы можете купить итальянскую дизайнерскую пряжу «В НАЛИЧИИ» или оформить "ПРЕДЗАКАЗ".<br><br>

                Через ПРЕДЗАКАЗ Вам открывается доступ к ассортименту стоковых складов Италии по оптовым ценам
                (при покупки всего от половинки бобины - это около 500 грамм).<br><br>

                <div class="d-flex align-content-center justify-space-between" style="cursor:pointer;"
                     @click="showPanel = !showPanel">
                    <span class="pa-0 ma-0 panel-title">
                        <b>С условиями «Предзаказа» Вы можете ознакомиться ниже.</b><br>
                        Все цены указаны за 1 грамм!
                    </span>
                    <v-btn
                        class="align-self-center not-primary"
                        color="transparent"
                        icon
                        variant="flat"
                    >
                        <v-icon :class="{ 'rotate': showPanel }" class="toggleUpDown">mdi-chevron-down</v-icon>
                    </v-btn>
                </div>

                <v-scroll-y-transition>
                    <div v-if="showPanel" class="mt-3">
                        <span>
                            <b>1.</b>  Срок ожидания предзаказа около 4 недель<br>
                            <b>2.</b>  Вес бобины точно не известен, В среднем это 1 кг.<br>
                            <b>3.</b>  Оплата по факту поступления. Предоплата 30% для новых участников при заказе 5 и более бобин<br>
                            <b>4.</b>  Цвет товара может немного отличаться, вместе со счетом высылается актуальные фото.<br>
                            <b>5.</b>  Цена может изменится при колебании курса евро<br>
                            <b>6.</b>  Заявка может быть отменена, если артикул не пришел от поставщика<br>
                            <b>7.</b>  В случае не выкупа предзаказа, вам может быть заблокирован доступ в систему.<br>
                            <b>8.</b>  Отправка товара в течение 2-3 раб дней после полной оплаты
                        </span>
                    </div>
                </v-scroll-y-transition>
                <br>

                Подпишитесь на рассылки, чтобы не пропустить новые «горячие» артикулы
            </v-card-text>

            <v-checkbox
                v-model="localIsChoiceRemembered"
                :color="themeParams.button_color ?? 'primary'"
                class="ml-3"
                label="Запомнить мой выбор"
            ></v-checkbox>
            <v-btn
                @click="onAccept"
            >
                Принять
            </v-btn>
        </v-card>
    </v-dialog>
</template>

<style lang="scss" scoped>
.v-card, .v-card * {
    background-color: var(--tg-theme-bg-color, rgb(var(--v-theme-background)));
    color: var(--tg-theme-text-color, rgb(var(--v-theme-on-surface)));
}

.panel-title {
    font-size: 1rem;
}

.toggleUpDown {
    transition: transform .3s ease-in-out !important;
}

.toggleUpDown.rotate {
    transform: rotate(-180deg);
}
</style>
