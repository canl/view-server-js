import { HighlightChangesModule, ModuleRegistry, ColDef, ValueFormatterParams, ValueParserParams } from 'ag-grid-community'

ModuleRegistry.registerModules([HighlightChangesModule])

function numberValueParser(params: ValueParserParams): number {
    return Number(params.newValue)
}

function numberCellFormatter(params: ValueFormatterParams): string {
    if (!params || !params.value) {
        return ''
    }

    return params.value.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function currencyCellFormatter(params: ValueFormatterParams): string {
    return '$' + numberCellFormatter(params)
}

export function numCol(column: ColDef, currency = false): ColDef {
    column.resizable = true
    column.valueParser = numberValueParser
    column.cellClass = 'right'
    column.valueFormatter = currency ? currencyCellFormatter : numberCellFormatter
    column.cellRenderer = 'agAnimateShowChangeCellRenderer'
    return column
}

export function curCol(column: ColDef): ColDef {
    return numCol(column, true)
} 