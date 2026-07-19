import type { ProjectionData } from '../../config/types';

/**
 * Общие константы проекций FWMF-карт.
 * Эти значения идентичны для всех карт, использующих FWMF-формат
 * (Tamriel, Vyn и т.д.), и вынесены сюда для устранения дублирования.
 */

/** Источник BTR-файла (относительный путь внутри FWMF-архива). */
export const PROJECTION_SOURCE = 'tamriel/tamriel.32.0.0.btr';

/** Имя меша в BTR-файле, содержащего данные проекции. */
export const PROJECTION_MESH_NAME = 'chunk:6';

/** Индекс блока данных внутри меша. */
export const PROJECTION_BLOCK_INDEX = 5;

/** Пути к текстурам карты. */
export const PROJECTION_TEXTURE_PATHS: string[] = ['textures\\terrain\\tamriel\\skyrim.dds'];

/** Количество чисел, описывающих одну вершину (x, y, u, v). */
export const PROJECTION_VERTEX_STRIDE = 4 as const;

/** Количество индексов на один треугольник. */
export const PROJECTION_TRIANGLE_STRIDE = 3 as const;

/**
 * Индексы треугольников для прямоугольного меша из двух треугольников.
 * Порядок: 0-1-2 и 0-2-3 (стандартный quad, разбитый по диагонали).
 */
export const PROJECTION_TRIANGLES: [number, number, number, number, number, number] = [0, 1, 2, 0, 2, 3];

/**
 * Базовые поля проекции, общие для всех FWMF-карт.
 * Используется как основа для построения конкретных проекций.
 */
export const BASE_PROJECTION: Pick<
  ProjectionData,
  'source' | 'meshName' | 'blockIndex' | 'texturePaths' | 'vertexStride' | 'triangleStride' | 'triangles'
> = {
  source: PROJECTION_SOURCE,
  meshName: PROJECTION_MESH_NAME,
  blockIndex: PROJECTION_BLOCK_INDEX,
  texturePaths: PROJECTION_TEXTURE_PATHS,
  vertexStride: PROJECTION_VERTEX_STRIDE,
  triangleStride: PROJECTION_TRIANGLE_STRIDE,
  triangles: PROJECTION_TRIANGLES,
};
