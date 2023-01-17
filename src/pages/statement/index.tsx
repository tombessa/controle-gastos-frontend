
import React, {useEffect, useMemo, useState} from 'react';
import Head from 'next/head';
import styles from './styles.module.scss'
import {Header} from '../../components/Header';
import {
  AccountProps,
  CategoryProps,
  CategoryResumeProps, CategoryResumeRequest,
  CategoryResumeRowDataProps,
  PeriodProps
} from '../../services/apiClient';
import { CompleteComboBox } from '../../components/ui/ComboBox';
import { setupAPIClient } from '../../services/api';
import { canSSRAuth } from '../../utils/canSSRAuth';
import {GenericMaterialTableProps, GenericTable} from '../../components/ui/Table';
import {PeriodOption, RowData} from "../dashboard";
import {Column} from "material-table";

export type StatementProps = {
  periods: PeriodProps[]
  statements: CategoryResumeProps[]
}

export default function Statement({periods, statements}: StatementProps){
  const [period, setPeriod] = useState<PeriodProps>();
  const [periodOption, setPeriodOption] = useState<PeriodOption>();
  
  const apiClient = setupAPIClient();
  const [rest, setRest] = useState<GenericMaterialTableProps>();
  const [columns, setColumns]=useState<Column<RowData>[]>([]);
  const[selectedRow, setSelectedRow] = useState<CategoryResumeRowDataProps>();

  async function load() {
    let array = returnTableColum();
    setColumns(array);

    let lista = period?(await apiClient.post('/category/resume', returnJsonQuery(period))).data:[];

    let dados : CategoryResumeRowDataProps[];

    dados = lista.map((item: { periodSumItem: { total: number; amount: number; }; }, index: any) => {
      return {...item,  percentual:(item.periodSumItem.total>0?(item.periodSumItem.amount/item.periodSumItem.total*100).toFixed(2):undefined)};
    });
    dados = dados.sort((a: { priority: number; }, b: { priority: number; }) => (a.priority > b.priority) ? 1 : ((b.priority > a.priority) ? -1 : 0));
    let expense = dados.filter(t=>t.expense);
    let earn = dados.filter(t=>!t.expense);
    let finalData = [...earn, ...expense];
    setRest({columns: array,
      data: finalData,
      setData: setSelectedRow,
      options:{
        pageSize:100
      }
    } );
  }

  function refresh(){
    if(periods){
      let array = periods.map((item)=> {return{...item, value: item.month + "/" + item.year}});
      setPeriodOption({value: period, setValue: setPeriod,  values: array});      
    }
    load();
  }
  const handleDateFilter = (term: string, rowData: any) => {
    if(rowData.percentual){
      return parseFloat(term) <= rowData.percentual
        ? true
        : false;
    } else return false;
  };

  function returnTableColum(): Column<RowData>[]{
    return [
      { title: 'Gasto?', field: 'expense',
        cellStyle: { width: "10%" },
        width: "10%",
        headerStyle: { width: "10%" }, type: 'boolean'},
      { title: 'Ordem', field: 'priority',
        cellStyle: { width: "10%" },
        width: "10%",
        headerStyle: { width: "10%" }},
      { title: 'Categoria', field: 'name',
        cellStyle: { width: "40%" },
        width: "40%",
        headerStyle: { width: "40%" }},
      { title: 'Valor', field: 'periodSumItem.amount',
        cellStyle: { width: "10%" },
        width: "10%",
        headerStyle: { width: "10%" }, type:'currency', currencySetting:{ locale: 'pt-br',currencyCode:'BRL', minimumFractionDigits:0, maximumFractionDigits:2}},
      { title: 'Total', field: 'periodSumItem.total',
        cellStyle: { width: "10%" },
        width: "10%",
        headerStyle: { width: "10%" }, type:'currency', currencySetting:{ locale: 'pt-br',currencyCode:'BRL', minimumFractionDigits:0, maximumFractionDigits:2}},
      { title: '%', field: 'percentual',
        cellStyle: { width: "10%" },
        width: "10%",align: "center",
        customFilterAndSearch: (term, rowData) => handleDateFilter(term, rowData),
        headerStyle: { width: "10%" },type:'numeric'},

    ];
  }

  function returnJsonQuery(period:PeriodProps) : CategoryResumeRequest{
    return {
      period:{
        month: period ? period.month: periods[0].month,
        year: period ? period.year: periods[0].year,
      }
    };
  }

  useEffect(()=>{
    setPeriod(periods[0]);
    refresh();
  },[period]);

  const montaComboPeriodo = useMemo(()=>{
    return (periodOption && periodOption.value && periodOption.values && periodOption.setValue &&
        <CompleteComboBox value={periodOption.value} setValue={periodOption.setValue} values={periodOption.values} />
    );
  }, [periodOption]);
  const montaTabelaExtrato = useMemo(()=>{
    return(<GenericTable rest={rest} selectedRow={selectedRow} setSelectedRow={setSelectedRow} />);
  }, [columns, rest, selectedRow, period]);
  
  return (<>
      <Head>
        <title></title>
      </Head>
      <div>
        
        <Header/>
        <main className={styles.container}>
          <div  className={styles.choiceTop}>
            {montaComboPeriodo}
          </div>
          
        </main>
        {montaTabelaExtrato}
      </div>
    </>
  );
}


export const getServerSideProps = canSSRAuth(async (ctx) => {
  // @ts-ignore
  const apiClient = setupAPIClient(ctx);
  const responsePeriods = await apiClient.get('/period');
  let statements = undefined;
  if((responsePeriods.data)){
    let jsonResume = {
      period:{
        month: responsePeriods.data[0].month,
        year: responsePeriods.data[0].year
      }
    }
    statements = await apiClient.post('/category/resume', jsonResume);
  }
  let retorno = {props:{}};
  if(responsePeriods.data) retorno.props = {...retorno.props, periods: responsePeriods.data.reverse()}
  retorno.props = statements && (statements.data) ?  {...retorno.props, statements: statements.data}:{...retorno.props};
  return retorno;
});