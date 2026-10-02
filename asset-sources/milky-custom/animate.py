"""Original, anatomy-specific Milky actions, baked for Blender 4.5 / glTF.

No downloaded motion, neural model, runtime constraints or external clip is used.
The timing is an authored first walk, not motion captured from Milky.  All units
are the model's units.  Positive X points toward the nose; positive Z is up.
"""

import math

import bpy
from mathutils import Matrix, Quaternion, Vector


TAU = math.tau
FPS = 60
CONTACT_PHASES = {"hind.L": 0.0, "fore.L": 0.34, "hind.R": 0.5, "fore.R": 0.84}


def smooth5(value):
    value = max(0.0, min(1.0, value))
    return value ** 3 * (10.0 + value * (-15.0 + 6.0 * value))


def foot_trajectory(phase, stride, stance, clearance):
    """Return contact displacement, lift and heel angle for a cyclic walk.

    Stance has precisely -stride displacement per unit cycle.  The quintic
    swing matches that velocity, zero vertical velocity, and acceleration at
    both boundaries.  This small backward follow-through avoids a sharp
    direction reversal at liftoff/touchdown.
    """
    phase %= 1.0
    extent = stride * stance * 0.5
    if phase < stance:
        heel = 0.20 * smooth5((phase / stance - 0.80) / 0.20)
        return extent - stride * phase, 0.0, heel
    swing = (phase - stance) / (1.0 - stance)
    x = -extent - stride * (1.0 - stance) * swing + stride * smooth5(swing)
    height = clearance * 64.0 * swing ** 3 * (1.0 - swing) ** 3
    heel = 0.20 * (1.0 - smooth5(swing / 0.35)) + 0.10 * math.sin(math.pi * swing) ** 2
    return x, height, heel


def solve_limb(start, target, first_length, second_length, bend_sign):
    """Fixed-length two-link IK, with a stable anatomical bend side.

    Returns the knee/elbow, actual endpoint and the required reach correction.
    A nonzero correction above roundoff is an authoring error, not a foot-lock
    technique.  author_actions rejects such an action instead of hiding slide.
    """
    delta = target - start
    distance = delta.length
    direction = delta.normalized()
    minimum = abs(first_length - second_length) + 1e-7
    maximum = first_length + second_length - 1e-7
    reached = min(maximum, max(minimum, distance))
    along = (first_length ** 2 - second_length ** 2 + reached ** 2) / (2.0 * reached)
    altitude = math.sqrt(max(0.0, first_length ** 2 - along ** 2))
    pole = Vector((float(bend_sign), 0.0, 0.0))
    perpendicular = (pole - direction * pole.dot(direction)).normalized()
    joint = start + direction * along + perpendicular * altitude
    endpoint = start + direction * reached
    return joint, endpoint, abs(distance - reached)


def rotation(x=0.0, y=0.0, z=0.0):
    return (Quaternion((0.0, 0.0, 1.0), z)
            @ Quaternion((0.0, 1.0, 0.0), y)
            @ Quaternion((1.0, 0.0, 0.0), x))


class MilkyPoseAuthor:
    def __init__(self, rig, config):
        self.rig = rig
        self.config = config
        self.bones = config["bones"]
        self.rest = {name: rig.data.bones[name].matrix_local.copy() for name in self.bones}
        self.heads = {name: Vector(value["head"]) for name, value in self.bones.items()}
        self.tails = {name: Vector(value["tail"]) for name, value in self.bones.items()}
        self.lengths = {name: (self.tails[name] - self.heads[name]).length for name in self.bones}
        self.world = {}
        self.max_reach_error = 0.0

    def inherited(self, name):
        parent = self.bones[name]["parent"]
        return self.world[parent] @ self.rest[parent].inverted() if parent else Matrix.Identity(4)

    def orient(self, name, head, orientation):
        self.world[name] = Matrix.Translation(head) @ orientation.to_matrix().to_4x4()

    def fk(self, name, delta=None, stabilized=False):
        inherited = self.inherited(name)
        head = inherited @ self.heads[name]
        if stabilized:
            orientation = self.rest[name].to_quaternion()
        else:
            orientation = (inherited @ self.rest[name]).to_quaternion()
        self.orient(name, head, (delta or Quaternion()) @ orientation)

    def segment(self, name, head, end):
        rest_vector = self.tails[name] - self.heads[name]
        turn = rest_vector.rotation_difference(end - head)
        self.orient(name, head, turn @ self.rest[name].to_quaternion())

    def sample(self, mode, phase):
        phase %= 1.0
        self.world = {}
        wave = TAU * phase
        walking = mode == "Walk"
        if walking:
            # The slight settled carriage supplies foreleg reach without
            # stretching its short bones.  There is no longitudinal root move.
            root_move = Vector((0.0, 0.006 * math.sin(wave + 0.25),
                                -0.024 + 0.0035 * math.cos(2.0 * wave - 0.25)))
            pelvis_rotation = rotation(x=0.011 * math.sin(wave),
                                       y=0.010 * math.sin(2.0 * wave),
                                       z=0.014 * math.sin(wave - 0.20))
            spine_rotation = rotation(x=-0.004 * math.sin(wave - 0.12),
                                      y=-0.004 * math.sin(2.0 * wave - 0.15),
                                      z=-0.009 * math.sin(wave - 0.10))
            chest_rotation = rotation(x=-0.011 * math.sin(wave - 0.28),
                                      y=0.003 * math.sin(2.0 * wave + 0.30),
                                      z=-0.008 * math.sin(wave + 0.20))
            neck_rotation = rotation(y=0.0035 * math.sin(2.0 * wave - 0.40),
                                     z=0.004 * math.sin(wave - 0.4))
            head_rotation = rotation(y=-0.002 * math.sin(2.0 * wave - 0.50))
        else:
            root_move = Vector((0.0, 0.0, 0.0012 * math.sin(wave)))
            pelvis_rotation = rotation(y=0.0015 * math.sin(wave))
            spine_rotation = rotation(y=-0.002 * math.sin(wave - 0.12))
            chest_rotation = rotation(y=0.0025 * math.sin(wave - 0.22))
            neck_rotation = rotation(y=0.002 * math.sin(wave - 0.32))
            head_rotation = rotation(y=-0.001 * math.sin(wave - 0.4))

        self.world["root"] = Matrix.Translation(root_move) @ self.rest["root"]
        self.fk("pelvis", pelvis_rotation)
        self.fk("spine", spine_rotation)
        self.fk("chest", chest_rotation)
        self.fk("neck", neck_rotation, stabilized=True)
        self.fk("head", head_rotation, stabilized=True)
        self.fk("jaw")

        contacts = {}
        walk = self.config["walk"]
        for side in ("L", "R"):
            for kind in ("fore", "hind"):
                label = f"{kind}.{side}"
                local_phase = (phase - CONTACT_PHASES[label]) % 1.0
                upper = f"{kind}.upper.{side}"
                lower = f"{kind}.lower.{side}"
                paw = f"{kind}.paw.{side}"
                toe = f"{kind}.toe.{side}"
                if kind == "fore":
                    scapular_angle = -0.095 * math.cos(TAU * local_phase) if walking else 0.0
                    self.fk(f"scapula.{side}", rotation(y=scapular_angle))
                start = self.inherited(upper) @ self.heads[upper]
                if walking:
                    x, lift, heel = foot_trajectory(local_phase, walk["stride"],
                                                    walk["stance"], walk["clearance"])
                else:
                    x, lift, heel = 0.0, 0.0, 0.0
                contact = self.tails[paw] + Vector((x, 0.0, lift))
                paw_turn = rotation(y=heel)
                wrist = contact - paw_turn @ (self.tails[paw] - self.heads[paw])
                joint, reached, error = solve_limb(start, wrist, self.lengths[upper],
                                                   self.lengths[lower], -1 if kind == "fore" else 1)
                self.max_reach_error = max(self.max_reach_error, error)
                self.segment(upper, start, joint)
                self.segment(lower, joint, reached)
                self.segment(paw, reached, contact)
                # Keep the toe pad down in stance while the metacarpal rolls
                # over it.  During swing, curl gently with the lifted paw.
                swing_weight = 0.0
                if walking and local_phase >= walk["stance"]:
                    u = (local_phase - walk["stance"]) / (1.0 - walk["stance"])
                    swing_weight = math.sin(math.pi * u) ** 2
                toe_vector = rotation(y=heel * swing_weight) @ (self.tails[toe] - self.heads[toe])
                self.segment(toe, contact, contact + toe_vector)
                contacts[label] = {
                    "position": list(contact),
                    "phase": local_phase,
                    "planted": not walking or local_phase < walk["stance"],
                }

        for side, mirror in (("L", 1.0), ("R", -1.0)):
            magnitude = 1.0 if walking else 0.18
            self.fk(f"ear.{side}", rotation(
                x=mirror * 0.017 * magnitude * math.sin(2.0 * wave - 0.70),
                y=0.032 * magnitude * math.sin(2.0 * wave - 0.75)))
            self.fk(f"ear.tip.{side}", rotation(
                y=0.044 * magnitude * math.sin(2.0 * wave - 1.10)))
        for index in range(1, 5):
            magnitude = 1.0 if walking else 0.22
            delay = 0.26 * index
            self.fk(f"tail.{index:02d}", rotation(
                y=0.016 * magnitude * math.sin(2.0 * wave - delay),
                z=0.027 * magnitude * math.sin(wave - delay)))
        return {name: matrix.copy() for name, matrix in self.world.items()}, contacts

    def basis(self, world, name):
        parent = self.bones[name]["parent"]
        basis = self.rest[name]
        if parent:
            basis = world[parent] @ self.rest[parent].inverted() @ basis
        return basis.inverted() @ world[name]


def action_curves(action):
    """Iterate legacy or layered-action fcurves without creating extra slots."""
    if action.is_action_legacy:
        yield from action.fcurves
        return
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                yield from bag.fcurves


def author_actions(rig, config):
    """Bake original Idle/Walk and return serializable motion/contact metadata.

    No existing scene objects, animations or tracks are removed.  On a freshly
    built MilkyRig, the action names are exactly Idle and Walk.  Idle is left
    active, and both actions are stashed on named, muted NLA tracks so glTF's
    ACTIONS export discovers both without layering them on the preview.
    """
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.render.fps_base = 1.0
    rig.animation_data_create()
    author = MilkyPoseAuthor(rig, config)
    actions = {}
    checks = {}
    for mode, seconds in (("Idle", 3.2), ("Walk", config["walk"]["duration"])):
        frame_count = round(seconds * FPS)
        action = bpy.data.actions.new(mode)
        action.use_fake_user = True
        rig.animation_data.action = action
        previous_quaternions = {}
        max_length_error = 0.0
        max_matrix_error = 0.0
        first_world = None
        for frame in range(frame_count + 1):
            scene.frame_set(frame)
            world, _ = author.sample(mode, frame / frame_count)
            if first_world is None:
                first_world = world
            for name in config["bones"]:
                pose = rig.pose.bones[name]
                location, quaternion, _ = author.basis(world, name).decompose()
                if name in previous_quaternions and quaternion.dot(previous_quaternions[name]) < 0.0:
                    quaternion.negate()
                previous_quaternions[name] = quaternion.copy()
                pose.rotation_mode = 'QUATERNION'
                pose.location = location
                pose.rotation_quaternion = quaternion
                pose.scale = (1.0, 1.0, 1.0)
                pose.keyframe_insert(data_path='location', frame=frame, group=name)
                pose.keyframe_insert(data_path='rotation_quaternion', frame=frame, group=name)
            bpy.context.view_layer.update()
            for name in config["bones"]:
                pose = rig.pose.bones[name]
                max_length_error = max(max_length_error,
                                       abs((pose.tail - pose.head).length - author.lengths[name]))
                max_matrix_error = max(max_matrix_error,
                                       max(abs(pose.matrix[r][c] - world[name][r][c])
                                           for r in range(4) for c in range(4)))
        for curve in action_curves(action):
            for point in curve.keyframe_points:
                point.interpolation = 'LINEAR'
        # Re-evaluate the saved action through Blender, rather than trusting
        # the pose values used while inserting its keys.  Half-frame checks
        # also expose the small difference between analytic IK and exported
        # quaternion interpolation at a finite baking rate.
        if action.slots:
            rig.animation_data.action_slot = action.slots[0]
        max_replay_matrix_error = 0.0
        max_subframe_contact_error = 0.0
        for half_frame in range(frame_count * 2 + 1):
            scene.frame_set(half_frame // 2, subframe=0.5 * (half_frame % 2))
            bpy.context.view_layer.update()
            expected, contacts = author.sample(mode, half_frame / (frame_count * 2))
            if half_frame % 2 == 0:
                for name in config["bones"]:
                    pose = rig.pose.bones[name]
                    max_replay_matrix_error = max(max_replay_matrix_error,
                        max(abs(pose.matrix[r][c] - expected[name][r][c])
                            for r in range(4) for c in range(4)))
            else:
                for label, contact in contacts.items():
                    kind, side = label.split('.')
                    actual = rig.pose.bones[f"{kind}.paw.{side}"].tail
                    max_subframe_contact_error = max(max_subframe_contact_error,
                        (actual - Vector(contact["position"])).length)
        track = rig.animation_data.nla_tracks.new()
        track.name = mode
        strip = track.strips.new(mode, 0, action)
        if action.slots:
            strip.action_slot = action.slots[0]
        strip.extrapolation = 'NOTHING'
        track.mute = True
        actions[mode] = action
        checks[mode] = {
            "frames": frame_count + 1,
            "duration_seconds": frame_count / FPS,
            "maximum_bone_length_error": max_length_error,
            "maximum_baked_matrix_error": max_matrix_error,
            "maximum_action_replay_matrix_error": max_replay_matrix_error,
            "maximum_half_frame_contact_error": max_subframe_contact_error,
            "loop_matrix_error": max(abs(world[name][r][c] - first_world[name][r][c])
                                     for name in world for r in range(4) for c in range(4)),
        }

    # Check intermediate trajectory reach as well as the baked 60 Hz samples.
    max_stance_velocity_error = 0.0
    minimum_toe_height = float('inf')
    previous = None
    sample_count = 2048
    dt = config["walk"]["duration"] / sample_count
    for index in range(sample_count + 1):
        _, contacts = author.sample("Walk", index / sample_count)
        for label, contact in contacts.items():
            minimum_toe_height = min(minimum_toe_height, contact["position"][2])
            if previous and contact["planted"] and previous[label]["planted"]:
                if contact["phase"] > previous[label]["phase"]:
                    velocity = (contact["position"][0] - previous[label]["position"][0]) / dt
                    expected = -config["walk"]["stride"] / config["walk"]["duration"]
                    max_stance_velocity_error = max(max_stance_velocity_error, abs(velocity - expected))
        previous = contacts
    if author.max_reach_error > 1e-5:
        raise ValueError(f"Milky's authored limbs exceed reach by {author.max_reach_error:.7f}")
    if any(check["maximum_baked_matrix_error"] > 1e-4 for check in checks.values()):
        raise ValueError("Milky's baked pose differs from the authored fixed-length skeleton")
    if any(check["maximum_action_replay_matrix_error"] > 1e-4 for check in checks.values()):
        raise ValueError("Milky's saved action does not reproduce its authored key poses")

    rig.animation_data.action = actions["Idle"]
    if actions["Idle"].slots:
        rig.animation_data.action_slot = actions["Idle"].slots[0]
    scene.frame_start = 0
    scene.frame_end = round(3.2 * FPS)
    scene.frame_set(0)
    return {
        "provenance": "Original analytic action authoring; no stock clips or captured Milky motion",
        "fps": FPS,
        "coordinate_system": config["coordinate_system"],
        "clips": {
            "Idle": {"duration": 3.2, "loop": True},
            "Walk": {
                "duration": config["walk"]["duration"],
                "stride": config["walk"]["stride"],
                "speed": config["walk"]["stride"] / config["walk"]["duration"],
                "stance_fraction": config["walk"]["stance"],
                "contacts": {label: {"start": phase, "duration": config["walk"]["stance"]}
                             for label, phase in CONTACT_PHASES.items()},
                "root_distance": [[0.0, 0.0], [config["walk"]["duration"], config["walk"]["stride"]]],
                "root_translation_baked": False,
                "loop": True,
            },
        },
        "validation": {
            "actions": checks,
            "trajectory_samples": sample_count + 1,
            "maximum_reach_error": author.max_reach_error,
            "maximum_stance_speed_error": max_stance_velocity_error,
            "minimum_contact_bone_height": minimum_toe_height,
            "limits": "Numerical source-rig checks do not establish likeness, natural movement, mesh-floor clearance, or exported playback quality.",
        },
    }
