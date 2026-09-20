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

export const tourExploreTitle = $localize `@@tour.explore.title:Explora — tu almacén en jerarquía`;
export const tourExploreDescription = $localize `@@tour.explore.description:A la izquierda ves la jerarquía real: Edificio → Planta → Sala → Armario → Cajón → Bandeja → Posición. Expande, colapsa y selecciona cualquier nivel. En el centro se muestra el contenido del lugar seleccionado.`;

export const tourMapTitle = $localize `@@tour.map.title:Mapa 2D, 3D y formas`;
export const tourMapDescription = $localize `@@tour.map.description:Para edificios, plantas y salas puedes alternar entre Lista, Mapa y 3D. En el Mapa arrastra y redimensiona rectángulos, edita formas en L/U a 90° y sube la imagen del plano real como fondo. En 3D las plantas se apilan en vertical.`;

export const tourItemsTitle = $localize `@@tour.items.title:Ítems, cuadrícula e historial`;
export const tourItemsDescription = $localize `@@tour.items.description:Haz clic en una bandeja para ver su cuadrícula: celdas libres y ocupadas, con validación de colisión. Selecciona un ítem a la derecha para ver detalle, ruta completa, cantidad con unidad e historial inmutable. Mover es arrastrar o clicar destino y confirmar — queda registrado.`;

export const tourSearchTitle = $localize `@@tour.search.title:Búsqueda y salto rápido`;
export const tourSearchDescription = $localize `@@tour.search.description:Arriba tienes la búsqueda instantánea: escribe código, nombre o ruta. Pulsa «Ir a…» en el árbol para el Quick Jump. Todo está pensado para encontrar una muestra en segundos, incluso con miles de ítems.`;

export const tourScanTitle = $localize `@@tour.scan.title:Escanear — entrada y salida`;
export const tourScanDescription = $localize `@@tour.scan.description:En Escanear gestionas altas y bajas con la cámara: modo Colocar (escanea ítem + destino) o Extraer (retira del almacén). En escritorio puedes simular un escaneo escribiendo «item:ITEM-0001» o «loc:ID». Cada acción queda en el historial y en la actividad reciente.`;

export const tourReportsTitle = $localize `@@tour.reports.title:Informes vivos`;
export const tourReportsDescription = $localize `@@tour.reports.description:En Informes ves métricas en vivo: ítems totales, ubicaciones en uso, no ubicados e integridad. Donuts por estado, edificio y categoría, línea temporal de movimientos y tabla de actividad reciente. Personaliza el dashboard y arrastra widgets.`;

export const tourSettingsTitle = $localize `@@tour.settings.title:Ajustes y tu espacio`;
export const tourSettingsDescription = $localize `@@tour.settings.description:En Ajustes defines identidad del laboratorio, unidades, formato de fecha, tema y exigencias de trazabilidad. Todo sigue local. Vuelve a «Sobre el producto» cuando quieras repasar funciones o relanzar este tour. ¡Ya puedes empezar!`;
