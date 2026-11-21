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

Trae precargados los 6 tramos (A1–B3) del mosaico 1:750 del Nivel 04, ya calibrados pixel↔UTM
(no hace falta marcar puntos de control para ese nivel). También acepta cualquier otra foto o
captura de plano (incluido un plano de superficie), calibrándola a mano con 2 puntos de control.

## Qué es cada archivo

- `index.html` — la app (toda la interfaz)
- `app.js` — toda la lógica (cálculo de coordenadas, guardado, exportación)
- `manifest.json`, `sw.js` — lo que la hace instalable y funcionar sin internet
- `icon-192.png`, `icon-512.png` — ícono de la app
- `assets/NIVEL04_*.png` — los 6 tramos del nivel 04, ya recortados y con grilla
- `assets/nivel04_manifest.json` — la calibración exacta de esos 6 tramos (no tocar a mano)

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
