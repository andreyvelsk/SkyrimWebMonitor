#!/usr/bin/env python3
import argparse
import json
import time
from pathlib import Path

if not hasattr(time, 'clock'):
    time.clock = time.perf_counter

from pyffi.formats.nif import NifFormat


def nif_string(value):
    if value is None:
        return ''
    if isinstance(value, bytes):
        return value.decode('utf-8', errors='replace')
    return str(value)


def find_shape(data, shape_name):
    for block in data.blocks:
        if block.__class__.__name__ != 'NiTriShape':
            continue
        if nif_string(getattr(block, 'name', '')) == shape_name:
            return block
    return None


def block_index(data, block):
    try:
        return data.blocks.index(block)
    except ValueError:
        return None


def iter_ref_blocks(block):
    try:
        yield from block.get_refs()
    except Exception:
        return


def get_shape_texture_paths(shape):
    paths = []
    for ref in iter_ref_blocks(shape):
        if ref.__class__.__name__ != 'BSLightingShaderProperty':
            continue
        for shader_ref in iter_ref_blocks(ref):
            if shader_ref.__class__.__name__ != 'BSShaderTextureSet':
                continue
            for texture in getattr(shader_ref, 'textures', []):
                path = nif_string(texture)
                if path:
                    paths.append(path)
    return paths


def find_shape_by_texture(data, texture_query):
    query = texture_query.lower()
    for block in data.blocks:
        if block.__class__.__name__ != 'NiTriShape':
            continue
        texture_paths = get_shape_texture_paths(block)
        if any(query in path.lower() for path in texture_paths):
            return block, texture_paths
    return None, []


def transform_vertex(shape, vertex):
    rotation = shape.rotation
    scale = float(shape.scale)
    x = float(vertex.x)
    y = float(vertex.y)
    z = float(vertex.z)
    world_x = (
        float(rotation.m_11) * x +
        float(rotation.m_12) * y +
        float(rotation.m_13) * z
    ) * scale + float(shape.translation.x)
    world_y = (
        float(rotation.m_21) * x +
        float(rotation.m_22) * y +
        float(rotation.m_23) * z
    ) * scale + float(shape.translation.y)
    return world_x, world_y


def extract_projection(
    input_path,
    output_path,
    shape_name,
    texture_query,
    image_width,
    image_height,
):
    data = NifFormat.Data()
    with input_path.open('rb') as source:
        data.read(source)

    texture_paths = []
    if texture_query:
        shape, texture_paths = find_shape_by_texture(data, texture_query)
    else:
        shape = find_shape(data, shape_name)
        if shape is not None:
            texture_paths = get_shape_texture_paths(shape)

    if shape is None:
        if texture_query:
            raise SystemExit(
                f'NiTriShape using texture {texture_query!r} was not found in {input_path}'
            )
        raise SystemExit(f'NiTriShape {shape_name!r} was not found in {input_path}')

    shape_data = shape.data
    uv_set = shape_data.uv_sets[0]

    vertices = []
    min_x = min_y = float('inf')
    max_x = max_y = float('-inf')
    min_u = min_v = float('inf')
    max_u = max_v = float('-inf')

    for vertex, uv in zip(shape_data.vertices, uv_set):
        x, y = transform_vertex(shape, vertex)
        u = float(uv.u)
        v = float(uv.v)
        vertices.extend([x, y, u, v])
        min_x = min(min_x, x)
        min_y = min(min_y, y)
        max_x = max(max_x, x)
        max_y = max(max_y, y)
        min_u = min(min_u, u)
        min_v = min(min_v, v)
        max_u = max(max_u, u)
        max_v = max(max_v, v)

    triangles = []
    for triangle in shape_data.triangles:
        triangles.extend([int(triangle.v_1), int(triangle.v_2), int(triangle.v_3)])

    payload = {
        'source': str(input_path),
        'meshName': nif_string(getattr(shape, 'name', '')),
        'blockIndex': block_index(data, shape),
        'texturePaths': texture_paths,
        'imageWidth': image_width,
        'imageHeight': image_height,
        'bounds': {
            'minX': min_x,
            'minY': min_y,
            'maxX': max_x,
            'maxY': max_y,
            'minU': min_u,
            'minV': min_v,
            'maxU': max_u,
            'maxV': max_v,
        },
        'vertexStride': 4,
        'triangleStride': 3,
        'vertices': vertices,
        'triangles': triangles,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, separators=(',', ':')) + '\n',
        encoding='utf-8',
    )

    print(
        f'Wrote {output_path} from {nif_string(getattr(shape, "name", ""))} '
        f'block {block_index(data, shape)}: '
        f'{len(vertices) // 4} vertices, {len(triangles) // 3} triangles'
    )
    if texture_paths:
        print('Textures:')
        for path in texture_paths:
            print(f'  {path}')


def main():
    parser = argparse.ArgumentParser(
        description='Extract the FWMF Tamriel projection mesh from a Skyrim BTR file.'
    )
    parser.add_argument(
        '--input',
        default='tamriel/tamriel.32.0.0.btr',
        type=Path,
        help='Source BTR file.',
    )
    parser.add_argument(
        '--output',
        default='src/pages/map/data/tamrielProjection.json',
        type=Path,
        help='Generated JSON projection asset.',
    )
    parser.add_argument(
        '--shape',
        default='chunk:16',
        help='Fallback NiTriShape name to extract when --texture is empty.',
    )
    parser.add_argument(
        '--texture',
        default='skyrim.dds',
        help='Texture path fragment used to select the visible FWMF map plane.',
    )
    parser.add_argument('--image-width', default=16384, type=int)
    parser.add_argument('--image-height', default=16384, type=int)
    args = parser.parse_args()

    extract_projection(
        args.input,
        args.output,
        args.shape,
        args.texture,
        args.image_width,
        args.image_height,
    )


if __name__ == '__main__':
    main()