# El Toponomicón de Cantabria

Una aplicación web interactiva para explorar la toponimia histórica de Cantabria, con énfasis en las huellas fonéticas del romance cántabro: metafonía, aspiración de la F inicial latina, y otros rasgos del habla tradicional.

## ¿Qué hace?

- **Mapa interactivo** (OpenStreetMap) con los topónimos georreferenciados como puntos, líneas o polígonos
- **Búsqueda** por nombre, con soporte para expresiones regulares y detección automática de la hache sopunteada (`h.` → `ḥ`)
- **Etiquetas** de clasificación etimológica y fonética (romance, celta, metafonía U/I, F aspirada, F muda…)
- **Panel de ajustes** configurable: qué etiquetas mostrar y cuándo, qué tipos de resultados incluir
- **Sin backend**: los datos se cargan desde un fichero JSON estático y se cachean en `localStorage`

## Estructura de los datos

Los topónimos se cargan desde `public/data.json` (no versionado). El formato es:

```json
{
  "hash": "v1",
  "data": [
    {
      "hash": "t001",
      "name": "Ḥuyu, el",
      "type": "point",
      "coordinates": "43.4312067,-3.889545168",
      "tags": "feature:metaphony_u,feature:aspirate_f,etymology:romance"
    },
    {
      "hash": "t012",
      "name": "La Ḥoyanca",
      "type": "line",
      "coordinates": "43.007898,-4.300307;43.007313,-4.296300",
      "tags": "etymology:romance,feature:aspirate_f"
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

Cuando el campo `hash` del fichero cambia respecto al que tiene guardado el navegador, la app descarga el fichero completo y actualiza la caché. Si no cambia, sirve los datos desde `localStorage` sin ninguna petición de red.

### Etiquetas disponibles

**Etimología:** `etymology:romance` · `etymology:celtic` · `etymology:celtoroman` · `etymology:ie` · `etymology:unknown`

**Rasgos fonéticos:** `feature:metaphony_u` · `feature:metaphony_i` · `feature:aspirate_f` · `feature:lost_f` · `feature:b_g` · `feature:antihiatic_yod`

## Ejecutar en local

```bash
nvm use 18
yarn install
```

Crea `public/data.json` con tus datos (ver formato arriba). Este fichero no está versionado; cada instancia mantiene el suyo propio.

```bash
yarn start
```

La app queda disponible en `http://localhost:3000/toponimia-cantabria`.

### Variable de entorno opcional

Crea `.env.local` si quieres apuntar a una URL externa para el fichero de datos:

```
REACT_APP_DATA_URL=https://ejemplo.com/mis-toponimos.json
```

Por defecto usa `public/data.json` del mismo servidor.

## Despliegue en GitHub Pages

```bash
yarn build
yarn deploy
```

## Stack

[React 18](https://react.dev/) · [React Router 6](https://reactrouter.com/) · [React Leaflet 4](https://react-leaflet.js.org/) · [React Bootstrap 2](https://react-bootstrap.github.io/) / Bootstrap 5 · Create React App 5
