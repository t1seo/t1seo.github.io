"""Project a verified real-dog BVH excerpt into local 2D joint samples."""
from pathlib import Path
import json, hashlib
import numpy as np
import argparse
from bvh import read_bvh
root = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('--source-frame-base', type=int, default=0, choices=(0, 10954))
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
provenance = json.loads((root / 'provenance.json').read_text())
actual_hash = hashlib.sha256(args.source.read_bytes()).hexdigest()
expected = provenance['fullClipSha256'] if args.source_frame_base == 0 else provenance['excerptSha256']
if actual_hash != expected:
    raise SystemExit('Source hash mismatch: expected ' + expected + ', received ' + actual_hash)
source_name = 'dog_quad_walk_001.bvh'
start, end = (10954, 11047)
nodes, dt, vals, pos, rot = read_bvh(args.source)
idx = {n['name']: i for i, n in enumerate(nodes)}
names = ['b_Hips', 'b_Spine', 'b_Spine1', 'b_Spine2', 'b_Spine3', 'b__Neck', 'b__Neck1', 'b__Neck2', 'b_Head', 'Dog_Jaw', 'b_LeftClav', 'b_LeftArm', 'b_LeftForeArm', 'b_LeftHand', 'b__LeftFinger', 'b_RightClav', 'b_RightArm', 'b_RightForeArm', 'b_RightHand', 'b_RightFinger', 'b_LeftLegUpper', 'b_LeftLeg', 'b_LeftLeg1', 'b_LeftAnkle', 'b_LeftToe', 'b_RightLegUpper', 'b_RightLeg', 'b_RightLeg1', 'b_RightAnkle', 'b_RightToe', 'b_Tail001', 'b_Tail002', 'b_Tail003', 'b_Tail004', 'b_Tail005', 'b_Tail006', 'b_Tail007', 'b_Tail008', 'b_Tail009']
a = pos[start - args.source_frame_base:end - args.source_frame_base + 1]
hip = a[:, idx['b_Hips']]
forward = a[:, idx['b_Spine3']] - hip
forward[:, 1] = 0
forward /= np.linalg.norm(forward, axis=1)[:, None]
heading = np.unwrap(np.arctan2(forward[:, 2], forward[:, 0]))
relative = a[:, [idx[n] for n in names]] - hip[:, None, :]
projected = np.stack([np.einsum('nij,nj->ni', relative, forward), a[:, [idx[n] for n in names], 1]], axis=2)
mid = (forward[:-1] + forward[1:]) / 2
mid /= np.linalg.norm(mid, axis=1)[:, None]
distance = np.r_[0, np.cumsum(np.sum(np.diff(hip, axis=0) * mid, axis=1))]
frames = [{'sourceFrame': start + i, 'time': round(i * dt, 8), 'joints': np.round(projected[i], 6).tolist(), 'rootDistance': round(float(distance[i]), 6), 'headingChangeRadians': round(float(heading[i] - heading[0]), 8)} for i in range(len(a))]
feet = ['b__LeftFinger', 'b_RightFinger', 'b_LeftToe', 'b_RightToe']
contacts = {}
for n in feet:
    j = names.index(n)
    xy = projected[:, j]
    v = np.gradient(xy[:, 0], dt)
    rvel = np.gradient(distance, dt)
    low = float(np.quantile(xy[:, 1], 0.1))
    high = float(np.quantile(xy[:, 1], 0.9))
    flag = (v < -0.45 * rvel) & (xy[:, 1] < low + 0.5 * (high - low))
    ranges = []
    on = None
    for i, z in enumerate(flag):
        if z and on is None:
            on = i
        if on is not None and (not z or i == len(flag) - 1):
            stop = i if z else i - 1
            ranges.append([round(on / (len(a) - 1), 5), round(stop / (len(a) - 1), 5)])
            on = None
    contacts[n] = {'heuristicIntervalsPhase': ranges, 'height10Percentile': round(low, 5), 'height90Percentile': round(high, 5)}
rmse = np.sqrt(np.mean((projected[-1, :30] - projected[0, :30]) ** 2))
max_error = np.max(np.linalg.norm(projected[-1, :30] - projected[0, :30], axis=1))
result = {'sourceURL': 'https://github.com/Tencent-RoboticsX/lifelike-agility-and-play/blob/master/data/raw_mocap_data/' + source_name, 'datasetURL': 'https://doi.org/10.6084/m9.figshare.24968946.v1', 'sourceFile': source_name, 'sourceSha256': provenance['fullClipSha256'], 'sourceFramesInclusive': [start, end], 'frameIndexing': 'zero-based', 'dt': dt, 'duration': (end - start) * dt, 'sourceFrameCount': 13197, 'names': names, 'coordinates': {'up': 'Y in BVH; output second coordinate is original world Y', 'forward': 'Per-frame horizontal normalized b_Hips to b_Spine3', 'outputX': 'Dot(worldJoint - worldHips, forward)', 'outputY': 'worldJoint.Y, without height normalization', 'units': 'Source units unchanged. Approximately centimeters inferred from 55-unit hip height, not an explicit dataset unit declaration.'}, 'conversion': {'rotationOrder': 'Zrotation Xrotation Yrotation, degrees; intrinsic matrix Rz*Rx*Ry', 'translation': 'Each declared position channel REPLACES that local offset component; no OFFSET + position duplication. Source repeats offsets in position channels.', 'filters': 'None in exported joint data. Source frames selected using endpoint pose+tangent similarity; see provenance.json. No resampling or averaging of exported values.', 'timeWarp': 'None', 'loopCorrection': 'None. Last sample retained independently. It is not numerically equal to first.', 'rootMotion': 'Signed cumulative hip movement projected onto mean consecutive horizontal headings. No clamping.', 'excludedNodes': 'Bip01_Footsteps, all Dog_*Armor*, Dog_LeftTail*, and terminal *Nub/End nodes. Their visual/helper semantics are not reliable anatomic contacts.'}, 'licenseStatus': provenance['licenseStatus'], 'contactEstimates': {'method': 'Heuristic only, NOT mocap ground-truth labels: local forward velocity < -45% root forward velocity and world height below halfway between foot 10th/90th-percentile height. No temporal smoothing/cleanup.', 'feet': contacts}, 'measurements': {'rootDistance': float(distance[-1]), 'meanForwardSpeed': float(distance[-1] / ((end - start) * dt)), 'headingChangeDegrees': float(np.rad2deg(heading[-1] - heading[0])), 'headingRangeDegrees': float(np.rad2deg(np.ptp(heading))), 'bodyLimbEndpointRMSE': float(rmse), 'bodyLimbEndpointMaxEuclideanError': float(max_error), 'hipHeightRange': np.ptp(hip[:, 1]).item(), 'startTimeSeconds': start * dt}, 'frames': frames}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(json.dumps(result['measurements'], indent=2))
print('Wrote', args.output)
