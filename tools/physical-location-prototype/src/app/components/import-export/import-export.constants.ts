import { $localize } from '../../i18n/localize';

export const importHeading = $localize `@@import.heading:Importar desde CSV`;
export const importHint = $localize `@@import.hint:Carga un CSV con al menos la columna catalogueNumber. Vista previa y validación dry-run antes de escribir nada. Todo o nada.`;
export const importSelectFile = $localize `@@import.selectFile:Seleccionar CSV`;
export const importNoFile = $localize `@@import.noFile:Ningún archivo seleccionado`;
export const importDelimiterLabel = $localize `@@import.delimiterLabel:Delimitador detectado`;
export const importPreviewHeading = $localize `@@import.previewHeading:Vista previa (primeras 5 filas)`;
export const importIssuesHeading = $localize `@@import.issuesHeading:Validación dry-run`;
export const importNoIssues = $localize `@@import.noIssues:Sin errores — listo para importar.`;
export const importIssuesCount = $localize `@@import.issuesCount:{count} fila(s) con errores — corrige el CSV antes de confirmar.`;
export const importConfirm = $localize `@@import.confirm:Confirmar importación`;
export const importSuccess = $localize `@@import.success:{count} ítems importados con éxito.`;
export const importClear = $localize `@@import.clear:Limpiar`;
export const importColumnCatalogue = $localize `@@import.column.catalogue:catalogueNumber`;
export const importColumnLabel = $localize `@@import.column.label:label`;
export const importColumnCategory = $localize `@@import.column.category:category`;
export const importColumnLocation = $localize `@@import.column.location:locationId`;
export const importDownloadTemplate = $localize `@@import.downloadTemplate:Descargar plantilla CSV`;

export const exportHeading = $localize `@@export.heading:Exportar`;
export const exportHint = $localize `@@export.hint:Descarga todo lo que ves en un CSV que vuelve a importar limpiamente (round-trip).`;
export const exportItems = $localize `@@export.items:Exportar ítems`;
export const exportLocations = $localize `@@export.locations:Exportar ubicaciones`;
export const exportMovements = $localize `@@export.movements:Exportar movimientos`;
