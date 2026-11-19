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

## Cómo instalarla en el iPhone (sin hosting, sin cuentas, sin Netlify, sin Claude, sin .zip)

No necesita subirse a ningún servidor ni servicio, y la carpeta se pasa tal cual — **sin
comprimirla**, porque iOS no acepta bien archivos .zip para esto. Dos formas de pasarla,
según de dónde salga:

**A) Si sale de un iPhone/iPad/Mac (AirDrop) — la más simple:**
1. Selecciona la carpeta `nwgeo_muestreo` completa (no un .zip) y mándala por AirDrop al
   iPhone de Jorge. AirDrop entre dispositivos Apple conserva la carpeta con todos sus
   archivos adentro, no hace falta descomprimir nada.
2. En su iPhone, al aceptar el AirDrop elige "Guardar en Archivos".
3. En la app **Archivos**, entra a la carpeta `nwgeo_muestreo` y toca `index.html` → se
   abre en Safari, ya funcionando completo: marcar puntos, UTM, guardar, exportar — todo
   corre localmente, sin internet.

**B) Si sale de tu computadora (no hay AirDrop, p. ej. Windows) — por Google Drive o
iCloud Drive, como carpeta (no como .zip):**
1. Sube la carpeta `nwgeo_muestreo` completa a una carpeta de Google Drive o iCloud Drive.
2. Comparte la liga de esa carpeta con Jorge (por WhatsApp o correo).
3. Jorge abre la liga en su iPhone (con la app de Google Drive, o directo en Archivos si
   es iCloud) y toca "Guardar en Archivos" / "Descargar" para esa carpeta completa.
4. En la app **Archivos**, entra a la carpeta y toca `index.html` → se abre en Safari,
   igual que arriba.

En ambos casos: para tenerla a la mano después, en Safari usa el botón de compartir →
"Agregar a pantalla de inicio" (o deja el acceso directo a `index.html` en Archivos y
ábrelo siempre desde ahí — los datos capturados se guardan en ese Safari del teléfono,
así que conviene abrirla siempre igual, no reinstalarla cada vez).

No hace falta GitHub, Netlify, cuenta de Apple nueva, ni cuenta de Claude — ni para ti ni
para Jorge.

### Cómo mandar la base de datos de vuelta (tu idea: Safari en la mina, internet en el campamento)

Exacto — así es como está pensada: dentro de la mina se usa sin señal (todo es local).
Cuando se llega al campamento con señal:

1. Pestaña **Puntos** → botón **Exportar CSV + GeoJSON**.
2. Se abre el menú de compartir de iOS: ahí se manda por WhatsApp, correo o AirDrop al
   celular o compu de quien esté consolidando los datos.
3. De vez en cuando conviene además mandar el "Exportar respaldo completo (JSON)" — ese
   es el que permite reconstruir todo si se cambia de teléfono o se reinstala Safari.

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
