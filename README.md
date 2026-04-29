# El Toponomasticón de Cantabria

**[→ morecar.github.io/toponimia-cantabria](https://morecar.github.io/toponimia-cantabria)**

Atlas toponímico interactivo de Cantabria, orientado al estudio de las huellas fonéticas del romance cántabro: metafonía, aspiración de la F inicial latina, y otros rasgos del habla tradicional.

Los topónimos se muestran sobre un mapa con sus etimologías y atestaciones históricas. Incluye un backoffice para crear y anotar borradores antes de incorporarlos al fichero de datos.

## Datos

Los datos no están versionados. Cada instancia mantiene los suyos en `dist/` (o `public/` en dev):

**`toponyms.json`**
```json
{
  "hash": "v1",
  "data": [
    {
      "hash": "t001",
      "name": "Ḥuyu, el",
      "vernacular": "El Foyu",
      "type": "point",
      "coordinates": "43.4312,-3.8895",
      "tags": "feature:metaphony_u,feature:aspirate_f,etymology:romance",
      "etymology_ids": ["etym001"],
      "attestations": [
        {
          "year": "1753",
          "source": "Catastro de Ensenada",
          "url": "",
          "occurrences": [{ "highlight": "Hoyo", "quote": "…el lugar llamado Hoyo…" }]
        }
      ],
      "notes": ""
    }
  ]
}
```

`coordinates`: un par `lat,lng` para puntos; varios separados por `;` para líneas y polígonos. Cuando el `hash` del fichero cambia, la app descarga los datos frescos y actualiza la caché del navegador.

**`etymologies.json`**
```json
{
  "hash": "v1",
  "data": [
    {
      "id": "etym001",
      "origin": "Latín FOCUS",
      "meaning": "hogar, fuego",
      "notes": "",
      "tags": "etymology:romance"
    }
  ]
}
```

## Ejecutar

```bash
nvm use 18.19.1
yarn install
yarn start        # http://localhost:5173/toponimia-cantabria
```

Para apuntar a ficheros de datos externos, crea `.env.local`:
```
REACT_APP_TOPONYMS_URL=https://ejemplo.com/toponyms.json
REACT_APP_ETYMOLOGIES_URL=https://ejemplo.com/etymologies.json
REACT_APP_GOOGLE_OAUTH_CLIENT_ID=...   # opcional, activa sync con Google Drive
```

## Despliegue

```bash
yarn deploy   # build + gh-pages
```
