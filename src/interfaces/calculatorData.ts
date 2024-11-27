import {ItemType} from "~/enums/itemType.ts";
import {Gender} from "~/enums/gender.ts";

export interface YarnWeightCalculatorData {
    size: number,
    itemType: ItemType,
    gender: Gender,
    footage: string,
    foldingNumber: number,
}

export interface YarnWeightCalculationResult {
    meters: number,
    grams: number,
}
