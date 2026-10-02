"""Derive compact curves from Catavitello et al. (2015), S1 Dataset (CC BY).
Usage: uv run --with scipy python extract.py PATH_TO_S1_DATASET REPO_ROOT
The public site needs only the resulting TypeScript table, not scipy or MAT files.
"""
import sys, json, hashlib
from pathlib import Path
import numpy as np
from scipy.io import loadmat

source, repo = map(Path, sys.argv[1:])
phase = np.linspace(0, 1, 33)
duty = .60
channels = {'fore': ['SCAPULA', 'UPPERARM', 'LOWERARM', 'HAND'], 'hind': ['THIGH', 'SHANK', 'FOOT']}
tables = {kind: [] for kind in channels}
swings = {kind: [] for kind in channels}
counts = {kind: 0 for kind in channels}
subjects = []
for path in sorted((source / 'Dogs Data').glob('*.mat')):
    walking = loadmat(path, simplify_cells=True)['dogdata']['walking']
    subjects.append({'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    limb_trials = {}
    for kind in channels:
        value = walking[kind + 'limb']
        limb_trials[kind] = value if isinstance(value, list) else [value]
    trunks = {}
    for fore in limb_trials['fore']:
        hind = next(t for t in limb_trials['hind'] if t['fname'] == fore['fname'])
        a = next(m for m in fore['P'] if m['label'] == 'SCA')
        b = next(m for m in hind['P'] if m['label'] == 'GTR')
        trunks[fore['fname']] = float(np.mean(np.hypot(a['X'] - b['X'], a['Y'] - b['Y'])))
    for kind, labels in channels.items():
        trials = walking[kind + 'limb']
        if not isinstance(trials, list): trials = [trials]
        curves = []
        swing_curves = []
        for trial in trials:
            gaits = trial['gait']
            if not isinstance(gaits, list): gaits = [gaits]
            for cycle_index, gait in enumerate(gaits):
                contact = gait['stance_perc'] / 100
                # Align measured touchdown and toe-off before averaging.
                measured_phase = np.where(phase <= duty, phase * contact / duty,
                    contact + (phase - duty) * (1 - contact) / (1 - duty))
                samples = []
                for label in labels:
                    data = np.asarray(gait[label]).ravel()
                    y = np.interp(measured_phase, np.linspace(0, 1, len(data)), data)
                    # Remove the small endpoint mismatch of recorded cycles.
                    y -= phase * (y[-1] - y[0])
                    samples.append(y)
                # Root height is normalized by mean trunk length, with camera drift removed.
                markers = {m['label']: m for m in trial['P']}
                root = markers['SCA' if kind == 'fore' else 'GTR']
                a, toeoff, b = np.atleast_2d(trial['cp'])[cycle_index].astype(int) - 1
                root_y = np.interp(a + measured_phase * (b - a), np.arange(len(root['Y'])), root['Y'])
                root_y -= root_y[0] + phase * (root_y[-1] - root_y[0])
                root_y -= np.mean(root_y)
                root_y /= trunks[trial['fname']]
                samples.append(root_y)
                curves.append(np.stack(samples, axis=1))
                toe = markers['DPF' if kind == 'fore' else 'DPH']
                swing_y = np.interp(toeoff + phase * (b - toeoff), np.arange(len(toe['Y'])), toe['Y'])
                swing_y -= np.linspace(swing_y[0], swing_y[-1], len(phase))
                swing_curves.append(swing_y / trunks[trial['fname']])
                counts[kind] += 1
        tables[kind].append(np.mean(curves, axis=0))
        swings[kind].append(np.mean(swing_curves, axis=0))
# Equal subject weighting: dogs with more recorded strides do not dominate.
tables = {kind: np.round(np.mean(values, axis=0), 3).tolist() for kind, values in tables.items()}
header = '''// Derived from Catavitello, Ivanenko & Lacquaniti (2015), S1 Dataset, CC BY 4.0.
// https://doi.org/10.1371/journal.pone.0133936.s001
// Equal-subject mean of six dogs, touchdown/toe-off aligned to 60% stance.
// Elevation angles in degrees; ROOT_Y in mean trunk lengths (positive up).
// 33 samples including the repeated cycle endpoint.
// Extraction, provenance and retargeting limits: asset-sources/milky-walk-kinematics/README.md
'''
text = header + 'export const CANINE_STANCE = .60;\n'
for kind, labels in channels.items():
    text += '// ' + ', '.join(labels + ['ROOT_Y']) + '\n'
    text += f'export const CANINE_{kind.upper()} = [\n'
    text += ''.join('  [' + ', '.join(map(str, row)) + '],\n' for row in tables[kind])
    text += '] as const;\n'
for kind, values in swings.items():
    curve = np.round(np.maximum(0, np.mean(values, axis=0)), 4).tolist()
    text += f'// Toe clearance over swing, in trunk lengths; endpoints are ground contacts.\nexport const CANINE_SWING_{kind.upper()} = ' + json.dumps(curve) + ' as const;\n'
(repo / 'src/cyber-pet-canine-data.ts').write_text(text)
(repo / 'asset-sources/milky-walk-kinematics/provenance.json').write_text(json.dumps({
    'source': 'https://doi.org/10.1371/journal.pone.0133936.s001',
    'authors': ['Giovanna Catavitello', 'Yuri P. Ivanenko', 'Francesco Lacquaniti'],
    'year': 2015, 'license': 'CC BY 4.0', 'subjectCount': 6, 'strideCounts': counts,
    'subjects': subjects, 'resampledStance': duty, 'samplesPerCurve': 33, 'swingSamples': 33, 'swingRounding': 0.0001,
    'units': {'angles': 'degrees from downward vertical; positive forward', 'ROOT_Y': 'mean trunk lengths; positive up', 'swingClearance': 'mean trunk lengths above interpolated toe-off/touchdown baseline'},
    'modifications': ['stance/swing time normalization', 'linear endpoint detrending', 'root height centering and mean SCA-GTR length normalization', 'DPF/DPH toe-marker swing clearance extraction', 'equal-subject averaging', 'rounding segment channels to 0.001 and swing clearance to 0.0001'],
}, indent=2) + '\n')
print(json.dumps({'subjects': len(subjects), 'strides': counts, 'output': 'src/cyber-pet-canine-data.ts'}))
