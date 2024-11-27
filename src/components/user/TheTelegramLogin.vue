<script lang="ts" setup>
import {urlSafeBase64Encode} from "~/utils/encoding.ts";
import telegramIcon from "~/assets/telegram.svg";
import {convertKeysToSnakeCase} from "~/utils/converters.ts";

// Common section
interface Props {
    telegramLogin: string,
    payloadData?: Record<any, any>,
    adminLogin: boolean,
}

const props = withDefaults(defineProps<Props>(), {
    adminLogin: () => false,
});

// Telegram section
const openTelegram = () => {
    const payload = props.payloadData
        ? urlSafeBase64Encode(`${props.adminLogin ? 'admin_' : ''}web=${JSON.stringify(convertKeysToSnakeCase(props.payloadData))}`)
        : urlSafeBase64Encode(`${props.adminLogin ? 'admin_' : ''}web=`);
    const url = `https://t.me/${props.telegramLogin}?start=${payload}`;
    window.open(url);
};
</script>

<template>
    <v-btn
        class="not-primary"
        color="#26a5e4"
        size="large"
        @click="openTelegram"
    >
        <img
            :src="telegramIcon"
            alt="Telegram"
            class="icon"
        />
        Войти
    </v-btn>
</template>

<style lang="scss" scoped>
.icon {
    filter: invert(1);
    width: 25px;
    height: 25px;
    margin-right: 10px;
}
</style>
