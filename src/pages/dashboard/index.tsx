import React, {useState, useMemo, useEffect, ChangeEventHandler, SetStateAction, Dispatch} from 'react';
import {canSSRAuth} from "../../utils/canSSRAuth";
import Head from 'next/head';
import {Header} from '../../components/Header';
import styles from './styles.module.scss'
import { setupAPIClient } from "../../services/api";
import Modal from 'react-modal';
import { toast } from "react-toastify";
import {
  AccountResumeProps,
  CategoryProps,
  PeriodProps,
  AccountProps,
  ExtratoProps,
  TotalResumeProps,
  AccountResumeRequest,
  ExtratoRowDataProps,
  EarnUpdateRequest
} from "../../services/apiClient";
import { ComboBox, CompleteComboBox, OptionCombo } from "../../components/ui/ComboBox";
import {GenericMaterialTableProps, GenericTable} from '../../components/ui/Table';
import moment from 'moment';
import {Column} from "material-table";

export type RowData = React.ReactElement<any>;


export type HomeProps = {
  periods: PeriodProps[]
  accounts: AccountProps[]
  accountResume: AccountResumeProps;
  earns: CategoryProps[];
  expenses: CategoryProps[];
}

export type AccountOption = {
  value: AccountProps|undefined
  setValue: Dispatch<SetStateAction<AccountProps|undefined>>
  values: AccountProps[]
}


export type PeriodOption = {
  value: PeriodProps|undefined
  setValue: Dispatch<SetStateAction<PeriodProps|undefined>>
  values: PeriodProps[]
}


export default function Dashboard({periods, accounts, accountResume, earns, expenses}: HomeProps){
  const [selectExtrato, setSelectExtrato] = useState<ExtratoRowDataProps>();
  const [period, setPeriod] = useState<PeriodProps>();
  const [account, setAccount] = useState<AccountProps>();

  const [periodOption, setPeriodOption] = useState<PeriodOption>();
  const [accountOption, setAccountOption] = useState<AccountOption>();

  const [accountResumeList, setAccountResumeList] =useState<ExtratoRowDataProps>();
  const [accountTotal, setAccountTotal] = useState<TotalResumeProps>();
  const [categories, setCategories] = useState<CategoryProps[]>();
  const [columns, setColumns]=useState<Column<RowData>[]>([]);

  const apiClient = setupAPIClient();
  const [rest, setRest] = useState<GenericMaterialTableProps>();

  function refresh(){
    if(accounts){
      let array = accounts.map((item)=> {return{...item, value: item.name + "/" + item.type}});      
      array.push({value: "", name: undefined, type: undefined, id:undefined});
      setAccountOption({value: account, setValue: setAccount, values:  array});      
    }
    if(periods){
      let array = periods.map((item)=> {return{...item, value: item.month + "/" + item.year}});
      array.push({month: undefined, year: undefined, id:undefined, value: ""});
      setPeriodOption({value: period, setValue: setPeriod,  values: array});      
    }
    load();
  }

  function returnResumeTotal(lista : AccountResumeProps) : TotalResumeProps{
    return {
      totalGanhoMesAnterior: lista.totalEarnsLastPeriod?lista.totalEarnsLastPeriod._sum.value:0,
      totalGanhoMesAtual: lista.totalEarns?lista.totalEarns._sum.value:0,
      totalGastoMesAnterior: lista.totalExpensesLastPeriod?lista.totalExpensesLastPeriod._sum.value:0,
      totalGastoMesAtual: lista.totalExpenses?lista.totalExpenses._sum.value:0,
      saldoMesAtual: ((lista.totalEarnsLastPeriod?lista.totalEarnsLastPeriod._sum.value:0)
              -(lista.totalExpensesLastPeriod?lista.totalExpensesLastPeriod._sum.value:0))
          +
          (
              (lista.totalEarns?lista.totalEarns._sum.value:0)
              -(lista.totalExpenses?lista.totalExpenses._sum.value:0))
    };
  }

  function returnTableColum(categoryList: CategoryProps[]): Column<RowData>[]{
    return [
      { title: 'Data', field: 'dateFormat', defaultSort: "desc",
        cellStyle: { width: "10%" },
        width: "10%",
        headerStyle: { width: "10%" }},
      { title: 'Categoria', field: 'category_id', lookup: categoryList,
        cellStyle: { width: "20%" },
        width: "20%",
        headerStyle: { width: "20%" }},
      { title: 'Descrição', field: 'description',
        cellStyle: { width: "60%" },
        width: "60%",
        headerStyle: { width: "60%" }},
      { title: 'Valor', field: 'value',
        cellStyle: { width: "10%" },
        width: "10%",
        headerStyle: { width: "10%" }, type:'currency',
        currencySetting:{ locale: 'pt-br',currencyCode:'BRL', minimumFractionDigits:0, maximumFractionDigits:2}}
    ];
  }

  function returnJsonQuery(account: AccountProps | undefined, period: PeriodProps | undefined) : AccountResumeRequest{
    return {
      expense:{
        account:{
          name: account ? account.name: undefined,
          type: account ? account.type: undefined
        }
      },
      earn:{
        account:{
          name: account ? account.name: undefined,
          type: account ? account.type: undefined
        }
      },
      period:{
        month: period ? period.month: undefined,
        year: period ? period.year: undefined,
      }
    };
  }

  function isEarn(category_id: string):Boolean{
    let filterEarn = earns.filter(t => t.id === category_id);
    return (filterEarn.length>0);
  }

  const handleRowDelete = async (oldData: ExtratoRowDataProps, resolve: Promise<any>) => {
    let bNewEarn = isEarn(oldData.category_id);
    apiClient.patch((bNewEarn ? '/earn/delete' : '/expense/delete'), {id: oldData.id});
    (await resolve)();
  }


  const handleRowAdd = async (newData: ExtratoRowDataProps, resolve: Promise<any>) => {
    let bNewEarn = isEarn(newData.category_id);
    let dateArray = newData.dateFormat.split("/");
    let newDate = moment(
        new Date(Number(dateArray[2]), Number(dateArray[1]) - 1, Number(dateArray[0])))
        .format('YYYY-MM-DD');
    newDate = newDate.concat("T06:00:00.000Z");
    let addJson = {
      category_id: newData.category_id,
      description: newData.description,
      value: newData.value,
      date: newDate,
      account: {
        name: account ? account.name : accounts[0].name,
        type: account ? account.type : accounts[0].type
      }
    };
    const add = apiClient.post((bNewEarn ? '/earn' : '/expense'), addJson);
    (await resolve)();
  }

  const handleRowUpdate = async (newData: ExtratoRowDataProps, oldData: ExtratoRowDataProps, resolve: Promise<any>) => {
    let bNewEarn = isEarn(newData.category_id);
    let bOldEarn = isEarn(oldData.category_id);
    let dateArray = newData.dateFormat.split("/");
    let newDate = moment(
        new Date(Number(dateArray[2]), Number(dateArray[1]) - 1, Number(dateArray[0])))
        .format('YYYY-MM-DD');
    newDate = newDate.concat("T06:00:00.000Z");
    let updateJson: EarnUpdateRequest;
    updateJson = {
      id: newData.id,
      date: newDate,
      category_id: (newData.category_id ? newData.category_id : oldData.category_id),
      description: (newData.description ? newData.description : oldData.description),
      value: (newData.value ? newData.value : oldData.value),
      account: {
        name: account ? account.name : accounts[0].name,
        type: account ? account.type : accounts[0].type
      }
    };

    let url;
    if (updateJson.value != undefined) {
      if (bNewEarn || bOldEarn) {
        url = '/earn';
      } else {
        url = '/expense';
        updateJson.value = -1 * updateJson.value;
      }
      const update = apiClient.patch(url, updateJson);
    }
    (await resolve)();
  }

  async function load() {
    let categoryList: CategoryProps[] = [];
    for (const item of earns) {// @ts-ignore
      categoryList[item.id]= item.name; }
    for (const item of expenses) {// @ts-ignore
      categoryList[item.id]= item.name ;}

    setCategories(categoryList);

    let lista = (await apiClient.post('/account/resume', returnJsonQuery(account, period))).data;

    let dados = lista.extrato;
    setAccountResumeList(dados);
    let array = returnTableColum(categoryList);
    setColumns(array);
    setRest({columns: array,
      data: dados,
      handleRowDelete: handleRowDelete,
      handleRowAdd: handleRowAdd,
      handleRowUpdate: handleRowUpdate,
      setData: setAccountResumeList,
      options:{
        pageSize:10
      }
    });
    setAccountTotal(returnResumeTotal(lista));

  }


  useMemo(()=>{
    load();
    setAccount(accounts[0]);
    setPeriod(periods[0]);
  }, []);

  useEffect(()=>{
    refresh();
  },[account, period]);

  const montaComboPeriodo = useMemo(()=>{
    return (periodOption && periodOption.value && periodOption.values && periodOption.setValue &&
        <CompleteComboBox value={periodOption.value} setValue={periodOption.setValue} values={periodOption.values} />
    );
  }, [periodOption]);
  const montaComboConta = useMemo(()=>{
    return (accountOption && accountOption.value && accountOption.values && accountOption.setValue &&
        <CompleteComboBox value={accountOption.value} setValue={accountOption.setValue} values={accountOption.values} />
    );
  }, [accountOption]);
  const montaTabelaExtrato = useMemo(()=>{
    return(<GenericTable rest={rest} selectedRow={selectExtrato} setSelectedRow={setSelectExtrato} />);
  }, [columns, selectExtrato, accountResumeList, account, period]);
  Modal.setAppElement('#__next'); //Verificado no código do next (id)  
  
  return(
    <>
      <Head>
        <title>Painel - Controle de Gastos</title>
      </Head>
      <div>
        
        <Header/>
        <main className={styles.container}>
          <div  className={styles.choiceTop}>
            {montaComboPeriodo}
            {montaComboConta}
          </div>
          <div  className={styles.choiceTopRefresh}>
            <label className={styles.labelSaldoApresentacao}>Mês Anterior</label>
            <label className={styles.labelSaldo}>Renda:{accountTotal?accountTotal.totalGanhoMesAnterior?accountTotal.totalGanhoMesAnterior.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}):"-":"-"}</label>
            <label className={styles.labelSaldo}>Gasto:{accountTotal?accountTotal.totalGastoMesAnterior?accountTotal.totalGastoMesAnterior.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}):"-":"-"}</label>            
            <label className={styles.labelSaldo}></label>
          </div>
          <div  className={styles.choiceTopRefresh}>
            <label className={styles.labelSaldoApresentacao}>Mês Atual</label>
            <label className={styles.labelSaldo}>Renda:{accountTotal?accountTotal.totalGanhoMesAtual?accountTotal.totalGanhoMesAtual.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}):"-":"-"}</label>
            <label className={styles.labelSaldo}>Gasto:{accountTotal?accountTotal.totalGastoMesAtual?accountTotal.totalGastoMesAtual.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}):"-":"-"}</label>
            {accountTotal?accountTotal.saldoMesAtual>0?
              <label className={styles.labelSaldoGreen}>Saldo:{accountTotal?accountTotal.saldoMesAtual?accountTotal.saldoMesAtual.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}):"-":"-"}</label>            
            :
              <label className={styles.labelSaldoRed}>Saldo:{accountTotal?accountTotal.saldoMesAtual?accountTotal.saldoMesAtual.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}):"-":"-"}</label>
            :
              <label className={styles.labelSaldo}>Saldo:-</label>}
          </div>
        </main>

        {montaTabelaExtrato}
      </div>
    </>
  )
}

export const getServerSideProps = canSSRAuth(async (ctx) => {
  // @ts-ignore
  const apiClient = setupAPIClient(ctx);
  const responseCategory = await apiClient.get('/category');

  const responsePeriods = await apiClient.get('/period');
  const responseAccounts = await apiClient.get('/account');
  let retorno = {props:{}};
  if(responsePeriods.data) retorno.props = {...retorno.props, periods: responsePeriods.data.reverse()}
  if(responseAccounts.data) retorno.props = {...retorno.props, accounts: responseAccounts.data}

  //earns
  const earns = responseCategory.data.filter((item: { expense: any; }) => !item.expense);
  const expenses = responseCategory.data.filter((item: { expense: any; }) => item.expense);
  if(responseCategory.data) retorno.props = {...retorno.props, earns: earns}
  //expenses
  if(responseCategory.data) retorno.props = {...retorno.props, expenses: expenses}

  let responseAccountResume = undefined;
  if((responsePeriods.data)&&(responseAccounts.data)){
    let jsonResume = {
      expense:{
        account:{
          name: responseAccounts.data[0].name,
          type: responseAccounts.data[0].type
        }
      },
      earn:{
        account:{
          name: responseAccounts.data[0].name,
          type: responseAccounts.data[0].type
        }
      },
      period:{
        month: responsePeriods.data[0].month,
        year: responsePeriods.data[0].year
      }
    };
    responseAccountResume = await apiClient.post('/account/resume', jsonResume)
    if(responseAccountResume) retorno.props = {...retorno.props, accountResume: responseAccountResume.data}
  }  
  
  return retorno;
})