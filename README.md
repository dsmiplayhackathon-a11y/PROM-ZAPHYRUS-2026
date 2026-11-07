# PROM ZAPHYRUS 2026 — Frontend etapa 1

Esta carpeta contiene una primera versión funcional del frontend. No está conectada a Google Sheets ni a Google Apps Script.

## 1. Dónde guardar las imágenes

Copia tus tres imágenes aprobadas dentro de la carpeta `assets/`, conservando exactamente estos nombres:

- `cortina terciopelo.png`
- `Tragamonedas dorada de bienvenida 2026.png`
- `Logo Zaphyrus 2026(1).png`

La aplicación no modifica ni genera estas imágenes. Si todavía no las has copiado, la experiencia usa una presentación CSS provisional para la cortina y la máquina.

**Importante sobre la tragamonedas:** los botones y rodillos de esta primera versión son elementos HTML reales, no forman parte de una imagen estática. La imagen aprobada se carga como referencia visual por encima de la máquina provisional. Como aún no se ha podido revisar esa imagen en este entorno, puede ser necesario ajustar su encuadre o decidir cómo integrarla visualmente sin tapar los controles.

El logotipo oficial queda disponible en `assets/` para integrarlo en la siguiente revisión de identidad visual; por ahora el encabezado usa una marca tipográfica provisional.

## 2. Cómo abrir la aplicación

1. Descomprime `PROM-ZAPHYRUS-2026.zip`.
2. Copia las imágenes a `PROM-ZAPHYRUS-2026/assets/`.
3. Abre `index.html` con Chrome, Firefox o Edge.
4. Pulsa **ENTRAR AL CASINO**.
5. Pulsa **START**.
6. Escribe `Pepito Perez` y confirma.
7. Acciona la palanca **TIRA** que aparece junto a la máquina.
8. Comprueba que el resultado sea **Mesa 07**.
9. Pulsa **FINALIZAR** para cerrar la cortina y reiniciar la experiencia.

La fuente tipográfica se descarga desde Google Fonts; si no hay internet, el sitio usa fuentes alternativas del sistema.

## 3. Dónde cambiar el registro de prueba

Abre `script.js` y localiza el arreglo `TEST_GUESTS`. El registro inicial es:

```js
{
  firstName: "Pepito",
  secondName: "",
  firstSurname: "Perez",
  secondSurname: "",
  table: 7,
  status: "ACTIVO"
}
```

La mesa que se muestra sale de `table`; no se sortea al azar. La aleatoriedad de esta etapa solo se usa para los símbolos decorativos de los rodillos y las partículas de pirotecnia.

## 4. Distribución del plano

En `script.js`, la configuración está al comienzo:

```js
const CONFIG = {
  demoMode: true,
  curtainOpenDuration: 1850,
  reelSpinDuration: 1900,
  resultFireworksDuration: 3200,
  totalTables: 14,
  tablesPerSide: 7
};
```

El plano coloca las mesas 01–07 en el lado izquierdo y 08–14 en el derecho. Si en el plano definitivo quieres otro orden de numeración, se ajustará en `buildFloorplan()`.

## 5. Archivos del proyecto

- `index.html`: estructura y contenido.
- `styles.css`: diseño, colores, distribución y animaciones.
- `script.js`: recorrido, validación temporal, rodillos, asignación y reinicio.
- `assets/`: imágenes oficiales que tú incorporarás.

## 6. Alcance y límites de esta etapa

- La validación se hace localmente contra un único registro de prueba.
- No hay conexión con Google Sheets.
- No hay autenticación ni protección de datos en backend.
- No se debe publicar esta versión como sistema real de asignación hasta implementar la consulta segura en Apps Script.
- El nombre de prueba se compara ignorando mayúsculas, tildes y espacios repetidos. Si la coincidencia no es exacta o es ambigua, no se revela la mesa.

## 7. Próximo ajuste recomendado

Cuando hayas colocado las imágenes, revisaremos la integración visual exacta de la cortina, la máquina y el logotipo. Después se podrá afinar el plano con las posiciones y servicios aprobados antes de conectar el backend.
