# Калибровка проекции для новой карты

## Обзор

Когда нет BTR-файла с FWMF-мешем (или меш состоит из множества файлов), проекцию можно вычислить **калибровкой по опорным точкам**. Метод подбирает параметры квад-проекции (`minX`, `maxX`, `minY`, `maxY`) напрямую, минимизируя ошибку на всех точках, и вычисляет остаточную `imageCorrection`-матрицу.

## Необходимые данные

1. **Размер изображения** карты в пикселях (`imageWidth` × `imageHeight`)
2. **Минимум 3 опорные точки** (рекомендуется 5–9 для лучшей точности). Каждая точка — пара:
   - **Игровые координаты** `(gameX, gameY)` — из данных сервера (hotspots) или консоли игры (`player.getpos x/y`)
   - **Пиксельные координаты** `(imageX, imageY)` — клик по локации на карте в приложении; координаты выводятся в консоль браузера: `[map] image px: { x: ..., y: ... }`

   **Важно**: точки должны быть равномерно распределены по карте (центр + 4 угла/края). Точки только в центре дадут плохую экстраполяцию к краям.

## Шаги

### 1. Собрать опорные точки

Запустите приложение, откройте нужную карту. Для каждой известной локации:
- Запишите её игровые координаты (из данных сервера — поле `x`, `y` в hotspots)
- Кликните по ней на карте — в консоли появится `[map] image px: { x: ..., y: ... }`
- Запишите пару: `gameX, gameY → imageX, imageY`

### 2. Запустить скрипт калибровки

```bash
python scripts/calibrate-map-projection.py \
  --image-width 4096 \
  --image-height 4096 \
  --points calibration_points.json \
  --output-vyn src/pages/map/data/projections/vyn.ts \
  --output-registry src/pages/map/config/mapRegistry.ts \
  --worldspace Vyn
```

Формат `calibration_points.json`:

```json
[
  { "gameX": -19297.37, "gameY": 34.45, "imageX": 2153.75, "imageY": 2302.01 },
  { "gameX": -110437.21, "gameY": 57360.35, "imageX": 1162.49, "imageY": 1690.69 },
  { "gameX": 76705.88, "gameY": -43453.27, "imageX": 3196.32, "imageY": 2762.87 }
]
```

### 3. Проверить результат

Скрипт выведет:
- Вычисленные bounds (`X_MIN`, `X_MAX`, `Y_MIN`, `Y_MAX`)
- Матрицу `imageCorrection`
- Ошибку на каждой точке (должна быть < 1 пикселя)

Если ошибка на каких-то точках > 2–3 пикселей — добавьте ещё точек в проблемных областях и перезапустите.

## Как работает метод (математика)

### Квад-проекция

4 вершины меша задают отображение игрового прямоугольника на текстурный:

```
X_MAX, Y_MAX, U_MAX(1), V_MIN(0)  — top-right
X_MIN, Y_MAX, U_MIN(0), V_MIN(0)  — top-left
X_MIN, Y_MIN, U_MIN(0), V_MAX(1)  — bottom-left
X_MAX, Y_MIN, U_MAX(1), V_MAX(1)  — bottom-right
```

Барицентрическая интерполяция внутри quad сводится к линейной:

```
rawX = (gameX - minX) / (maxX - minX) * imageWidth
rawY = (maxY - gameY) / (maxY - minY) * imageHeight
```

### Подгонка bounds (метод наименьших квадратов)

Переписываем проекцию как линейную функцию:

```
rawX = sx * gameX + ox,   где sx = IW / (maxX - minX),  ox = -minX * sx
rawY = sy * gameY + oy,   где sy = -IH / (maxY - minY), oy = maxY * IH / (maxY - minY)
```

Для каждой оси решаем линейную регрессию `(gameCoord) → (imageCoord)`:

```
sx = (n*Σ(gx*ix) - Σgx*Σix) / (n*Σ(gx²) - (Σgx)²)
ox = (Σix - sx*Σgx) / n
```

Из `sx, ox` восстанавливаем bounds:

```
maxX - minX = IW / sx
minX = -ox / sx
maxX = minX + (maxX - minX)

maxY - minY = -IH / sy
maxY = -oy / sy
minY = maxY - (maxY - minY)
```

### Остаточная imageCorrection

После подгонки bounds ошибка на точках < 1–2 px. Остаточная аффинная матрица убирает и её:

```
correctedX = a*rawX + c*rawY + e
correctedY = b*rawX + d*rawY + f
```

Вычисляется методом наименьших квадратов по парам `(rawX, rawY) → (imageX, imageY)`.

## Сравнение с BTR-методом

| | BTR (Tamriel) | Калибровка (Vyn) |
|---|---|---|
| Источник bounds | FWMF-меш из .btr | Подгонка по опорным точкам |
| Точность | Абсолютная (меш из игры) | ~1 px при 5+ точках |
| Требуется .btr | Да (один файл) | Нет |
| imageCorrection | Компенсирует artist distortion | Компенсирует остаток ~1 px |