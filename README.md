# El Toponomicón de Cantabria

Una aplicación web interactiva para explorar la toponimia histórica de Cantabria, con énfasis en las huellas fonéticas del romance cántabro: metafonía, aspiración de la F inicial latina, y otros rasgos del habla tradicional.

## ¿Qué hace?

- **Mapa interactivo** (OpenStreetMap) con los topónimos georreferenciados como puntos, líneas o polígonos
- **Búsqueda** por nombre, con soporte para expresiones regulares y detección automática de la hache sopunteada (`h.` → `ḥ`)
- **Etiquetas** de clasificación etimológica y fonética (romance, celta, metafonía U/I, F aspirada, F muda…)
- **Panel de ajustes** configurable: qué etiquetas mostrar y cuándo, qué tipos de resultados incluir
- **Panel de detalle** con etimología, significado y atestaciones históricas del topónimo seleccionado
- **Sin backend**: los datos se cargan desde ficheros JSON estáticos y se cachean en `localStorage`

## Estructura de los datos

### Topónimos (`public/toponyms.json`, no versionado)

```json
{
  "hash": "v1",
  "data": [
    {
      "hash": "t001",
      "name": "Ḥuyu, el",
      "type": "point",
      "coordinates": "43.4312067,-3.889545168",
      "tags": "feature:metaphony_u,feature:aspirate_f,etymology:romance",
      "vernacular": "El Foyu",
      "etymology_ids": ["etym001"],
      "attestations": [
        {
          "year": "1753",
          "highlight": "Hoyo",
          "source": "Catastro de Ensenada",
          "quote": "…el lugar llamado Hoyo…",
          "url": ""
        }
      ]
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `hash` | Identificador único del topónimo (usado en las URLs de enlace directo) |
| `name` | Nombre en grafía histórica o dialectal |
| `type` | `point`, `line` o `poly` |
| `coordinates` | Pares `lat,lng` separados por `;` (un par para puntos, varios para líneas y polígonos) |
| `tags` | Etiquetas separadas por `,` |
| `vernacular` | *(opcional)* Forma patrimonial o dialectal, si difiere del nombre oficial |
| `etymology_ids` | *(opcional)* Array de IDs de etimologías referenciadas en `etymologies.json` |
| `attestations` | *(opcional)* Array de atestaciones históricas |

Cuando el campo `hash` del fichero cambia respecto al que tiene guardado el navegador, la app descarga el fichero completo y actualiza la caché.

### Etimologías (`public/etymologies.json`, no versionado)

```json
{
  "data": [
    {
      "id": "etym001",
      "origin": "Prelatino *LAMA",
      "meaning": "terreno pantanoso, hondonada húmeda",
      "notes": "Hipótesis que conecta el topónimo con la raíz prelatina *lama…"
    }
  ]
}
```

### Etiquetas disponibles

**Etimología:** `etymology:romance` · `etymology:celtic` · `etymology:celtoroman` · `etymology:ie` · `etymology:unknown`

**Rasgos fonéticos:** `feature:metaphony_u` · `feature:metaphony_i` · `feature:aspirate_f` · `feature:lost_f` · `feature:b_g` · `feature:antihiatic_yod`

## Backoffice

La app incluye un portal de edición en `/backoffice` para crear y gestionar borradores de nuevos topónimos antes de incorporarlos al fichero de datos.

### Funcionalidades

- **Formulario de nuevo topónimo** con todos los campos: nombre, forma patrimonial (opcional), tipo geométrico, coordenadas (dibujo en mapa), etiquetas, atestaciones y etimologías.
- **Etiquetas con autocompletado**: escribe para filtrar las etiquetas conocidas (con colores por categoría: azul para `etymology:*`, naranja para `feature:*`). Si la etiqueta no existe, se puede crear al vuelo.
- **Selector de etimología**: busca entre las etimologías existentes por origen, significado o notas. Si no existe, crea una nueva etimología borrador directamente desde el formulario.
- **Exportar a JSON**: genera un fichero `nuevos-toponimos.json` con los borradores en el formato del fichero de datos, listo para revisar e integrar.
- Los borradores se guardan en `localStorage` del navegador.

## Ejecutar en local

```bash
nvm use 18.19.1
yarn install
```

Crea `public/toponyms.json` y `public/etymologies.json` con tus datos (ver formato arriba). Estos ficheros no están versionados; cada instancia mantiene los suyos propios.

```bash
yarn start
```

La app queda disponible en `http://localhost:3000/toponimia-cantabria`.

### Variable de entorno opcional

Crea `.env.local` si quieres apuntar a una URL externa para los ficheros de datos:

```
REACT_APP_DATA_URL=https://ejemplo.com/mis-toponimos.json
```

Por defecto usa `public/toponyms.json` del mismo servidor. El fichero de etimologías se busca en la misma ruta base sustituyendo `toponyms.json` por `etymologies.json`.

## Despliegue en GitHub Pages

```bash
yarn build
yarn deploy
```

## Stack

[React 18](https://react.dev/) · [React Router 6](https://reactrouter.com/) · [React Leaflet 4](https://react-leaflet.js.org/) · [React Bootstrap 2](https://react-bootstrap.github.io/) / Bootstrap 5 · Create React App 5
