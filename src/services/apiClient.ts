import { setupAPIClient } from './api'
import {RowData} from "../pages/dashboard";


export type PeriodProps = {
    id: string|undefined;
    month: number|undefined;
    year: number|undefined;
    value: string|undefined;
}


export type AccountProps = {
    id: string|undefined;
    name: string|undefined;
    type: string|undefined;
    value: string|undefined;
}


export type SumProps = {
    _sum: {value: number}
}

export type GoalPeriodProps ={
    id: string
    amount: number
}

export type CategoryResumeProps = {
    id: string
    name: string
    expense: boolean
    includeGoal: boolean
    priority: number
    goalPeriods: GoalPeriodProps
    periodSumItm: SumProps
    percentual: number
}

export type CategoryProps = {
    id: string
    name: string
    expense: boolean
    includeGoal: boolean
    priority: number
}

export interface CategoryResumeRowDataProps extends CategoryResumeProps, RowData{
    percentual: number;
}

export interface ExtratoRowDataProps extends ExtratoProps, RowData {

}

export type ExtratoProps ={
    id: string
    date: Date
    description: string
    value: number
    category_id: string
    goal_period_id: string
    bank_id: string
    category: CategoryProps
    dateFormat: string
}

export type TotalResumeProps = {
    totalGanhoMesAnterior: number
    totalGanhoMesAtual: number
    totalGastoMesAnterior: number
    totalGastoMesAtual: number
    saldoMesAtual: number
}

export type AccountResumeProps = {
    accountReturn : AccountProps[];
    totalEarnsLastPeriod: SumProps;
    totalEarns: SumProps;
    totalExpensesLastPeriod: SumProps;
    totalExpenses: SumProps;
    extrato: ExtratoRowDataProps;
}

export interface CategoryResumeRequest{
    period: {month: number|undefined; year: number|undefined; }
}

export interface AccountResumeRequest{
    expense :{account : {name: string|undefined; type: string|undefined}}
    earn :{account : {name: string|undefined; type: string|undefined}}
    period: {month: number|undefined; year: number|undefined; }
}

export interface EarnUpdateRequest{
    id: string
    date: string|undefined
    description: string|undefined
    value: number|undefined
    category_id: string|undefined
    account:{name: string|undefined; type: string|undefined}
}


export const api = setupAPIClient();