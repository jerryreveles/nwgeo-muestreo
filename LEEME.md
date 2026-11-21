# nwgeo Muestreo — captura offline de mapeo geológico interior mina y superficie

PWA (app web instalable) autocontenida, sin servidor ni internet, para iPhone. Sirve para
marcar puntos directo sobre el plano del nivel (o sobre un plano de superficie) y sacar su
coordenada UTM al instante, en campo, sin señal.

Captura cinco capas de mapeo, elegibles con los chips de color arriba del plano:

- **Muestreo geoquímico** (dorado) — canal, esquirlas, grab, rezaga; longitud de canal
- **Alteración** (morado) — tipo (propilítica, argílica, sericítica/fílica, potásica,
  silicificación, limonita in situ/halo/exótica) e intensidad
- **Litológico** (azul) — unidad litológica y textura/fábrica de roca
- **Estructural** (rojo) — tipo de estructura (falla, veta, vetilla, contacto, fractura),
  rumbo, echado y bloque del alto/bajo
- **Superficie** (verde) — tipo de afloramiento y descripción general, para mapeo en
  superficie con el mismo plano/calibración

Cada punto guarda su capa; el pin en el plano y la lista de puntos se colorean según la capa.
El CSV y el GeoJSON exportados traen todas las columnas de todas las capas (vacías las que no
aplican a cada punto).

Trae precargados **todos los niveles digitalizados de Congreso-León** (02, 03, 04, 05, 06, 07,
08 y 09) más un plano de **Superficie** con el ortomosaico del dron, todos ya calibrados
pixel↔UTM (no hace falta marcar puntos de control en ninguno). En "Proyecto" elige primero el
nivel (o Superficie) y luego el tramo/plancha. El Nivel 04 es el único que trae además los 6
tramos históricos escaneados (A1–B3) junto con su plano completo; los demás niveles (02, 03, 05,
06, 07, 08, 09) traen un plano completo generado directamente de la digitalización vectorial
(SHP) de cada nivel, con grilla UTM cada 50 m. También acepta cualquier otra foto o captura de
plano, calibrándola a mano con 2 puntos de control.

### Plano de Superficie: geología digitalizada + ortomosaico

"Superficie" trae dos planchas, elige la que necesites:

- **Geología superficial digitalizada** — los 187 polígonos de litología digitalizados de las
  6 cartas "Geología Superficial" de Frisco (1973-75, 1:1000): aluvión/talud, Fm. Candelaria,
  Fm. San Pedro y diorita, con su color propio de carta y los tres brocales conocidos (Laird,
  Congreso, Old León) de referencia. Precisión UTM esperada +-3 a 5 m (ver
  `02_GEORREFERENCIACION/GEOLOGIA_LEEME.txt` en tu disco para la auditoría completa: de dónde
  salen las 4 clases, por qué las fallas con rumbo/echado no se pudieron sacar de estas cartas,
  y la advertencia de cota — estas cartas están en el datum local de mina, 78.4 m por debajo
  del real).
- **Ortomosaico de superficie (dron)** — recorte del ortomosaico fotogramétrico de
  Congreso-León, calibrado con los mismos tres brocales (no con el georreferenciado interno del
  archivo original, porque el `.tif` completo de 1.4 GB es demasiado grande para traer tal cual);
  trae además, de referencia, los trazos superpuestos de los niveles 5, 6 y 9 que ya se habían
  conciliado con ese ortomosaico.

El DEM de elevación (`DEM.tif` / `demspc.tif`, en tu disco en
`04_LEVANTAMIENTOS/02_ORTOMOSAICO_Y_DEM`) da la cota del terreno en cada punto pero no es una
imagen que sirva como fondo visual para tocar y marcar; si más adelante necesitas la cota de
superficie en un punto específico, eso se calcula aparte (muestreo de cotas sobre el DEM), no es
parte de esta app.

## Qué es cada archivo

- `index.html` — la app (toda la interfaz)
- `app.js` — toda la lógica (cálculo de coordenadas, guardado, exportación)
- `manifest.json`, `sw.js` — lo que la hace instalable y funcionar sin internet
- `icon-192.png`, `icon-512.png` — ícono de la app
- `assets/NIVEL04_*.png` — los 6 tramos históricos escaneados del nivel 04, ya recortados y con grilla
- `assets/NIVEL0{2,3,5,6,7,8,9}_FULL.png` — plano completo de cada nivel, generado de su SHP digitalizado
- `assets/SUPERFICIE_ORTOMOSAICO.png` — recorte del ortomosaico de dron, calibrado por los 3 brocales
- `assets/niveles_manifest.json` — la calibración exacta de todos los niveles y de Superficie (no tocar a mano)

## Cómo instalarla en el iPhone

1. Sube toda la carpeta `nwgeo_muestreo` a Netlify (arrastrar la carpeta a app.netlify.com/drop,
   igual que con "nwgeo Campo"), o a cualquier hosting estático / tu propio servidor.
2. Abre la liga que te dé Netlify en Safari del iPhone.
3. Botón de compartir (cuadrito con flecha) → "Agregar a pantalla de inicio".
4. Ábrela desde el ícono: ya queda instalada y funciona sin internet (el service worker guarda
   todo en el teléfono la primera vez que abre con señal).

## Cómo se usa en campo

1. Pestaña **Proyecto** → botón del tramo del nivel 04 que vas a muestrear (A1 a B3). Si es
   otro nivel u otro plano: "Cargar plano" con una foto o captura, y calibrar 2 puntos de la
   grilla con su coordenada UTM conocida.
2. Pestaña **Plano**: elige primero el chip de color de la capa que vas a mapear (Muestreo,
   Alteración, Litológico, Estructural o Superficie). Luego toca el punto exacto → se abre la
   ficha con la coordenada UTM ya calculada y los campos propios de esa capa. Llena clave y
   datos. Guardar.
3. Pestaña **Puntos**: lista completa; tocar una fila la abre para editar o borrar.
4. Botón **Exportar CSV + GeoJSON** cuando termines la jornada: usa el botón de compartir de
   iOS para mandarlo por AirDrop, correo o guardarlo en Archivos.
5. "Exportar respaldo completo (JSON)" de vez en cuando, por si se reinstala Safari o se cambia
   de teléfono — eso sí reconstruye todo (puntos, calibraciones, planos propios cargados).

## Lista de verificación antes de salir a campo

- [ ] Batería del iPhone cargada (la app no gasta datos, pero sí batería de pantalla)
- [ ] App abierta una vez con señal (para que el service worker guarde todo offline)
- [ ] Tramo del nivel correcto seleccionado en Proyecto
- [ ] Si es plano propio: ya calibrado con 2 puntos y "Calibrado con 2 puntos ✓" visible
- [ ] Espacio libre en el teléfono para fotos/exportaciones

## Material necesario

- iPhone con Safari (iOS 16 o más reciente recomendado)
- Plano del nivel a muestrear (ya cargado el de nivel 04; para otro nivel, foto clara y de
  frente de la lámina impresa, o captura de pantalla del PDF del mosaico)
- Libreta de campo como respaldo físico de la clave de cada muestra (regla de la casa)

## Límites conocidos (es PWA, no app nativa de App Store)

- No lee GPS ni RTK por Bluetooth: Safari iOS no tiene Web Bluetooth. La coordenada sale de la
  posición tocada sobre el plano calibrado, no de un receptor.
- Un plano cargado = un tramo. Para el mosaico completo, cambiar de tramo en Proyecto según
  en qué parte de la labor estés.
- No corre en segundo plano. Si se usa otra app mucho rato, reabrir desde el ícono.
- Pensada para muestreo de interior mina (PC-MUE-02): posiciona puntos sobre un plano en
  planta, no reemplaza el levantamiento topográfico ni la poligonal.
