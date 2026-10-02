"""Offline BVH forward kinematics for the recorded canine source."""

from pathlib import Path
import re

import numpy as np


def read_bvh(path):
    """Return nodes, frame interval, channels, world positions and rotations.

    This dataset repeats local OFFSET values in explicit position channels.
    Each declared XYZ position replaces that component of the offset.
    """
    header, motion = Path(path).read_text().split("MOTION", 1)
    tokens = re.findall(r"[^\s]+", header)
    cursor, channel_count = 1, 0
    nodes = []

    def read_node(parent):
        nonlocal cursor, channel_count
        kind, name = tokens[cursor : cursor + 2]
        cursor += 2
        if kind == "End":
            name = nodes[parent]["name"] + "_End"
        if tokens[cursor] != "{":
            raise ValueError("Expected opening node brace")
        cursor += 1
        index = len(nodes)
        node = {
            "name": name,
            "parent": parent,
            "offset": [],
            "channels": [],
            "start": channel_count,
        }
        nodes.append(node)
        while tokens[cursor] != "}":
            token = tokens[cursor]
            if token == "OFFSET":
                node["offset"] = list(map(float, tokens[cursor + 1 : cursor + 4]))
                cursor += 4
            elif token == "CHANNELS":
                count = int(tokens[cursor + 1])
                node["channels"] = tokens[cursor + 2 : cursor + 2 + count]
                node["start"] = channel_count
                channel_count += count
                cursor += count + 2
            elif token in ("JOINT", "End"):
                read_node(index)
            else:
                raise ValueError("Unexpected hierarchy token: " + token)
        cursor += 1

    read_node(-1)
    lines = motion.strip().splitlines()
    frame_count = int(lines[0].split(":")[1])
    interval = float(lines[1].split(":")[1])
    values = np.fromstring("\n".join(lines[2:]), sep=" ").reshape(
        frame_count, channel_count
    )
    if not np.isfinite(values).all() or interval <= 0:
        raise ValueError("Invalid motion samples or frame interval")
    positions = np.zeros((frame_count, len(nodes), 3))
    rotations = np.zeros((frame_count, len(nodes), 3, 3))

    for index, node in enumerate(nodes):
        translation = np.tile(node["offset"], (frame_count, 1))
        rotation = np.tile(np.eye(3), (frame_count, 1, 1))
        for offset, channel in enumerate(node["channels"]):
            value = values[:, node["start"] + offset]
            axis = "XYZ".index(channel[0])
            if "position" in channel:
                translation[:, axis] = value
            elif "rotation" in channel:
                angle = np.deg2rad(value)
                cosine, sine = np.cos(angle), np.sin(angle)
                matrix = np.tile(np.eye(3), (frame_count, 1, 1))
                first, second = [other for other in range(3) if other != axis]
                matrix[:, first, first] = cosine
                matrix[:, second, second] = cosine
                sign = -1 if axis == 1 else 1
                matrix[:, first, second] = -sign * sine
                matrix[:, second, first] = sign * sine
                rotation = rotation @ matrix

        parent = node["parent"]
        if parent < 0:
            positions[:, index] = translation
            rotations[:, index] = rotation
        else:
            positions[:, index] = positions[:, parent] + np.einsum(
                "nij,nj->ni", rotations[:, parent], translation
            )
            rotations[:, index] = rotations[:, parent] @ rotation
    return nodes, interval, values, positions, rotations
