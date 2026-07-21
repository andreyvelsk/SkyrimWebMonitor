# Извлечение проекций FWMF для карт

## Обзор

Каждая карта в `public/maps/` требует соответствующий файл проекции в `src/pages/map/data/projections/`. Файл проекции описывает, как игровые координаты (X, Y worldspace) преобразуются в пиксельные координаты на изображении карты.

Проекция извлекается из `.btr`-файлов игры (формат NIF), которые содержат FWMF-меш — плоскую сетку, связывающую игровые координаты с UV-координатами текстуры карты.

## Зависимости

Скрипт требует Python 3 и библиотеку `pyffi`:

```bash
pip install pyffi
```

> **Примечание:** `pyffi` может требовать Python ≤ 3.11. Для Python 3.12+ используйте виртуальное окружение с Python 3.11.

## Использование

```bash
python scripts/extract-fwmf-projection.py \
  --input <путь к .btr файлу> \
  --output src/pages/map/data/projections/<worldspace>.json \
  --texture <фрагмент пути к текстуре> \
  --image-width <ширина PNG карты в пикселях> \
  --image-height <высота PNG карты в пикселях>
```

### Параметры

| Параметр | По умолчанию | Описание |
|---|---|---|
| `--input` | `tamriel/tamriel.32.0.0.btr` | Путь к исходному BTR-файлу |
| `--output` | `src/pages/map/data/tamrielProjection.json` | Путь для сохранения JSON |
| `--texture` | `skyrim.dds` | Фрагмент пути к текстуре для поиска нужного NiTriShape |
| `--shape` | `chunk:16` | Имя NiTriShape (используется только если `--texture` не задан) |
| `--image-width` | `16384` | Ширина PNG-файла карты в пикселях |
| `--image-height` | `16384` | Высота PNG-файла карты в пикселях |

### Примеры

#### Tamriel (основная карта Скайрима)

```bash
python scripts/extract-fwmf-projection.py \
  --input "tamriel/tamriel.32.0.0.btr" \
  --output "src/pages/map/data/projections/tamriel.json" \
  --texture "skyrim.dds" \
  --image-width 16384 \
  --image-height 16384
```

#### Solstheim (DLC Dragonborn)

```bash
python scripts/extract-fwmf-projection.py \
  --input "dlc2solstheimworld/dlc2solstheimworld.32.0.0.btr" \
  --output "src/pages/map/data/projections/dlc2SolstheimWorld.json" \
  --texture "dlc2solstheimworld.dds" \
  --image-width 8192 \
  --image-height 8192
```

## Формат выходного JSON

```json
{
  "source": "путь/к/файлу.btr",
  "meshName": "chunk:6",
  "blockIndex": 5,
  "texturePaths": ["textures\\terrain\\tamriel\\skyrim.dds"],
  "imageWidth": 16384,
  "imageHeight": 16384,
  "bounds": {
    "minX": -254800.0, "minY": -266800.0,
    "maxX": 266800.0,  "maxY": 254800.0,
    "minU": 0.0, "minV": 0.0,
    "maxU": 1.0, "maxV": 1.0
  },
  "vertexStride": 4,
  "triangleStride": 3,
  "vertices": [x, y, u, v, ...],
  "triangles": [i0, i1, i2, ...]
}
```

- `vertices` — плоский массив, по 4 значения на вершину: `[gameX, gameY, texU, texV]`
- `triangles` — плоский массив индексов вершин, по 3 на треугольник
- `bounds` — ограничивающий прямоугольник в игровых и текстурных координатах

## Добавление новой карты

### Шаг 1: Поместить PNG

Скопировать PNG-файл карты в `public/maps/<worldspace>.png`.

### Шаг 2: Сгенерировать DZI-тайлы

#### Локально (macOS)

Установить `libvips`:

```bash
brew install vips
```

Сгенерировать тайлы:

```bash
vips dzsave public/maps/<worldspace>.png public/map-dzi/<worldspace> \
  --layout dz \
  --tile-size 512 \
  --overlap 1 \
  --suffix '.webp[Q=80]'
```

После выполнения в `public/map-dzi/` появятся:
- `<worldspace>.dzi` — XML-манифест
- `<worldspace>_files/` — каталог с тайлами WebP по уровням

#### Через CI/CD

Запустить workflow [`build-map.yml`](.github/workflows/build-map.yml) вручную (workflow_dispatch) — он скачает все PNG из релиза `map-source`, сгенерирует DZI для каждого и загрузит архив в релиз `map-assets`.

### Шаг 3: Извлечь проекцию

```bash
python scripts/extract-fwmf-projection.py \
  --input <путь к .btr файлу> \
  --output src/pages/map/data/projections/<worldspace>.json \
  --texture <фрагмент пути к текстуре> \
  --image-width <ширина PNG> \
  --image-height <высота PNG>
```

### Шаг 4: Зарегистрировать карту

Добавить запись в [`mapRegistry.ts`](src/pages/map/config/mapRegistry.ts):

```ts
import newMapProjection from '../data/projections/<worldspace>.json';

const newMapConfig: MapConfig = {
  worldspace: '<WorldspaceEditorID>',
  dziUrl: `${import.meta.env.BASE_URL}map-dzi/<worldspace>.dzi`,
  projectionData: newMapProjection as ProjectionData,
  // imageCorrection — опционально, калибруется вручную (см. ниже)
  cropX: 0,         // подобрать по границам изображения
  cropYTop: 0,
  cropYBottom: 0,
};

export const mapRegistry: MapRegistry = {
  Tamriel: tamrielConfig,
  '<WorldspaceEditorID>': newMapConfig,
};
```

### Шаг 5: Откалибровать (опционально)

При необходимости откалибровать `imageCorrection` и `referencePoints` (см. секцию «Калибровка imageCorrection»).

## Калибровка imageCorrection

Матрица `imageCorrection` компенсирует расхождение между UV-координатами FWMF-меша и реальными пиксельными координатами на hand-painted карте.

Для калибровки:
1. Открыть карту в приложении
2. Кликнуть по известным локациям (городам) и записать игровые координаты и пиксельные координаты из консоли (`[map] image px: { x: ..., y: ... }`)
3. Вычислить аффинную матрицу коррекции методом наименьших квадратов
4. Добавить матрицу в конфиг карты

## Проверка скрипта

Скрипт [`extract-fwmf-projection.py`](scripts/extract-fwmf-projection.py) проверен:

- ✅ Корректно парсит BTR/NIF файлы через `pyffi`
- ✅ Находит `NiTriShape` по текстуре или имени
- ✅ Применяет трансформацию вершины (rotation × scale + translation)
- ✅ Извлекает UV-координаты
- ✅ Формат выхода совместим с `useMapProjection.ts`
- ⚠️ `imageWidth`/`imageHeight` задаются вручную — должны совпадать с размерами PNG
- ⚠️ `imageCorrection` не извлекается автоматически — калибруется отдельно
- ⚠️ Зависимость от `pyffi` — рекомендуется Python ≤ 3.11