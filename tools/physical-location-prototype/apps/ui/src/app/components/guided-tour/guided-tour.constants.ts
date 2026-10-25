import { $localize } from '../../i18n/localize';

export const tourSkip = $localize `@@tour.skip:Saltar tour`;
export const tourNext = $localize `@@tour.next:Siguiente`;
export const tourBack = $localize `@@tour.back:Atrás`;
export const tourFinish = $localize `@@tour.finish:¡Empezar a explorar!`;
export const tourProgressAria = $localize `@@tour.progressAria:Progreso del tour`;
export const tourStepLabel = $localize `@@tour.stepLabel:Paso {current} de {total}`;

export const tourWelcomeTitle = $localize `@@tour.welcome.title:¡Te damos la bienvenida a Nexus Lab!`;
export const tourWelcomeDescription = $localize `@@tour.welcome.description:Nexus Lab te ayuda a saber, en segundos, dónde está cada muestra y qué le ha pasado. En este breve recorrido viajaremos por la app — sin mover datos reales, solo explorando.`;
export const tourWelcomeBullet1 = $localize `@@tour.welcome.bullet1:Local-first: todo queda en este dispositivo`;
export const tourWelcomeBullet2 = $localize `@@tour.welcome.bullet2:Sin servidores ni cuentas obligatorias`;
export const tourWelcomeBullet3 = $localize `@@tour.welcome.bullet3:5 minutos hasta tu primera muestra ubicada`;

export const tourNavigationTitle = $localize `@@tour.navigation.title:Navegación principal`;
export const tourNavigationDescription = $localize `@@tour.navigation.description:Esta barra lateral es tu mapa de la aplicación. Desde aquí saltas entre Explorar (tu almacén), Escanear (altas y bajas con cámara), Informes (métricas en vivo), Importar/Exportar (copias de seguridad CSV), Ajustes y Sobre el producto.`;

export const tourLocationTreeTitle = $localize `@@tour.locationTree.title:Jerarquía de ubicaciones`;
export const tourLocationTreeDescription = $localize `@@tour.locationTree.description:Aquí ves la jerarquía real de tu colección: Edificio → Planta → Sala → Armario → Cajón → Bandeja → Posición. Expande y colapsa nodos, selecciona cualquier nivel y usa «Ir a…» para saltar directamente a una muestra.`;

export const tourMap2dTitle = $localize `@@tour.map2d.title:Mapa 2D del edificio`;
export const tourMap2dDescription = $localize `@@tour.map2d.description:Para edificios, plantas y salas puedes ver el plano en 2D. Arrastra y redimensiona los rectángulos, edita formas en L o U a 90°, y sube la imagen del plano real como fondo.`;

export const tourMap3dTitle = $localize `@@tour.map3d.title:Vista 3D`;
export const tourMap3dDescription = $localize `@@tour.map3d.description:La vista 3D apila plantas y salas en vertical. Útil para hacerte una idea rápida de la distribución espacial y detectar huecos o saturaciones de un vistazo.`;

export const tourTrayGridTitle = $localize `@@tour.trayGrid.title:Cuadrícula de bandeja`;
export const tourTrayGridDescription = $localize `@@tour.trayGrid.description:Al seleccionar una bandeja aparece su cuadrícula: celdas libres y ocupadas con validación de colisión. Desde aquí sabes exactamente dónde cabe la siguiente muestra.`;

export const tourItemDetailTitle = $localize `@@tour.itemDetail.title:Detalle de una muestra`;
export const tourItemDetailDescription = $localize `@@tour.itemDetail.description:Al hacer clic en un ítem ves su ficha completa: código de catálogo, nombre, cantidad con unidad, estado, ruta completa y un historial inmutable de movimientos.`;
export const tourItemDetailBullet1 = $localize `@@tour.itemDetail.bullet1:La ruta muestra dónde está (Edificio / Sala / Cajón / Posición)`;
export const tourItemDetailBullet2 = $localize `@@tour.itemDetail.bullet2:Ningún movimiento se borra; solo se añaden correcciones`;

export const tourAddItemTitle = $localize `@@tour.addItem.title:Crear ítems y ubicaciones`;
export const tourAddItemDescription = $localize `@@tour.addItem.description:Este botón cambia según dónde estés: añade salas, armarios, cajones, bandejas o ítems. Al crear un ítem escribe su código de catálogo, nombre, categoría y cantidad con unidad; Nexus Lab lo ubica al instante y registra el movimiento.`;

export const tourSearchTitle = $localize `@@tour.search.title:Búsqueda y salto rápido`;
export const tourSearchDescription = $localize `@@tour.search.description:La barra superior busca por código, nombre o ruta completa. Encuentra una muestra en segundos incluso con miles de ítems, y pulsa un resultado para ir directamente a su ubicación.`;

export const tourScanExtractTitle = $localize `@@tour.scanExtract.title:Escanear — extraer una muestra`;
export const tourScanExtractDescription = $localize `@@tour.scanExtract.description:El modo Extraer es para dar salida a una muestra: préstamo, análisis externo o retirada temporal. Escanea el código del ítem con la cámara o escríbelo a mano en escritorio («item:ITEM-0001»). La operación queda registrada en el historial.`;

export const tourScanPlaceTitle = $localize `@@tour.scanPlace.title:Escanear — colocar una muestra`;
export const tourScanPlaceDescription = $localize `@@tour.scanPlace.description:El modo Colocar ubica una muestra en dos pasos: primero escaneas el ítem y después el destino. Si algo no encaja (por ejemplo, la ubicación no existe), el aviso aparece en la tabla de actividad reciente.`;
export const tourScanPlaceBullet1 = $localize `@@tour.scanPlace.bullet1:Escanea primero la muestra`;
export const tourScanPlaceBullet2 = $localize `@@tour.scanPlace.bullet2:Después escanea la ubicación destino`;


export const tourReportsTitle = $localize `@@tour.reports.title:Informes vivos`;
export const tourReportsDescription = $localize `@@tour.reports.description:El dashboard muestra métricas actualizadas: ítems totales, ubicaciones en uso, no ubicados e integridad. Añade widgets de donuts por estado, categoría o edificio, una línea temporal de movimientos y la tabla de actividad reciente.`;

export const tourDataTitle = $localize `@@tour.data.title:Importar y exportar`;
export const tourDataDescription = $localize `@@tour.data.description:En Importar/Exportar llevas tu copia de seguridad. Importa ubicaciones e ítems desde CSV con validación previa, y exporta ítems, ubicaciones y movimientos cuando quieras. Tus datos siempre son tuyos y legibles fuera de la app.`;

export const tourFinishTitle = $localize `@@tour.finish.title:Ya estás listo`;
export const tourFinishDescription = $localize `@@tour.finish.description:En Ajustes puedes cambiar unidades, tema, formato de fecha y exigencias de trazabilidad. Desde Sobre el producto repasas las funciones o relanzas este tour cuando lo necesites.`;
export const tourFinishBullet1 = $localize `@@tour.finish.bullet1:Toda la información se guarda localmente en este dispositivo`;
export const tourFinishBullet2 = $localize `@@tour.finish.bullet2:Nada se borra sin dejar rastro: cada cambio queda registrado`;
