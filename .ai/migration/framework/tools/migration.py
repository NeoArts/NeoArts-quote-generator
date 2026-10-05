#!/usr/bin/env python3
"""Initialize migration records and validate their structure. Python 3.10+."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import sys

PROFILES = ('generic', 'web', 'desktop', 'mobile', 'service', 'batch')
STAGE_STATUS = {'NOT_STARTED', 'RUNNING', 'PASSED', 'BLOCKED', 'NOT_APPLICABLE'}
RUN_STATUS = {'NOT_STARTED', 'RUNNING', 'HUMAN_REQUIRED', 'BLOCKED', 'BUDGET_EXHAUSTED', 'COMPLETE'}
FEATURE_STATUS = {'DISCOVERED', 'SPECIFIED', 'IMPLEMENTING', 'IMPLEMENTED', 'VERIFIED', 'BLOCKED', 'RETIRED'}
MILESTONES = {'NONE', 'READY_FOR_RELEASE', 'DEPLOYED', 'MIGRATION_COMPLETE', 'LEGACY_RETIRED'}


def read_json(path):
    with path.open(encoding='utf-8-sig') as handle:
        return json.load(handle)


def save_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def init(args):
    project = Path(args.project_root).expanduser().resolve()
    legacy = Path(args.legacy_root).expanduser().resolve()
    package = Path(__file__).resolve().parent.parent
    if not project.is_dir() or not legacy.is_dir():
        raise ValueError('Both project-root and legacy-root must be existing directories.')
    if project == package or package in project.parents:
        raise ValueError('Choose a project outside the framework library.')
    if not args.objective.strip():
        raise ValueError('Provide a non-empty migration objective.')
    migration = project / '.ai' / 'migration'
    if migration.exists() or migration.is_symlink():
        raise ValueError(f'Refusing to overwrite existing migration state: {migration}')
    # Do not follow an existing .ai junction/symlink to a different workspace.
    resolved_ai = (project / '.ai').resolve()
    if not resolved_ai.is_relative_to(project):
        raise ValueError('The .ai path resolves outside the project; initialization refused.')
    required = ['MASTER.md', 'templates/PROJECT.json', 'templates/AUTHORITY.json',
                'templates/STATE.json', 'templates/FEATURES.json']
    for relative in required:
        if not (package / relative).is_file():
            raise ValueError(f'Framework package is incomplete: missing {relative}')
    # Capture sources before creating the destination; do not copy caches.
    sources = [p for p in package.rglob('*') if p.is_file()
               and '__pycache__' not in p.parts and p.suffix != '.pyc']
    migration.parent.mkdir(parents=True, exist_ok=True)
    migration.mkdir(exist_ok=False)  # An exclusive claim also protects against concurrent init.
    marker = migration / 'INITIALIZATION_INCOMPLETE.txt'
    marker.write_text('Initialization has not finished. Preserve this directory and inspect the error before resuming.\n', encoding='utf-8')
    for source in sources:
        destination = migration / 'framework' / source.relative_to(package)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    project_record = read_json(package / 'templates/PROJECT.json')
    project_record.update(project_name=project.name, objective=args.objective.strip(),
                          legacy_root=str(legacy), target_root=str(project), profiles=[args.profile])
    save_json(migration / 'PROJECT.json', project_record)
    for name in ('AUTHORITY.json', 'FEATURES.json', 'INDEX.md', 'DECISIONS.md', 'RISKS_AND_UNKNOWNS.md'):
        shutil.copy2(package / 'templates' / name, migration / name)
    state = read_json(package / 'templates/STATE.json')
    state['updated_at'] = datetime.now(timezone.utc).isoformat()
    save_json(migration / 'STATE.json', state)
    for name in ('stages', 'workflows', 'evidence', 'runs', 'work_packages', 'improvements'):
        (migration / name).mkdir()
    (migration / 'improvements' / 'PROPOSALS.md').write_text(
        '# Improvement proposals\n\nNo proposals yet. Capture evidence during migration and finalize at stage 13.\n', encoding='utf-8')
    (migration / 'START_HERE.md').write_text(
        '# Project migration\n\nRead [framework/MASTER.md](framework/MASTER.md), applicable repository instructions, '
        'and the project records before doing work. See [framework/QUICKSTART.md](framework/QUICKSTART.md) '
        'for the launch prompt.\n\nInitialization created records only; it did not discover or verify the application.\n', encoding='utf-8')
    # This removes only our known marker, never user files or directories.
    marker.unlink()
    print(f'Initialized migration records: {migration}')
    print('No application commands were executed. Open the target project and use framework/QUICKSTART.md.')
    return 0


def validate(args):
    project = Path(args.project_root).expanduser().resolve()
    root = project / '.ai' / 'migration'
    errors = []

    def check(condition, message):
        if not condition:
            errors.append(message)

    def load(name):
        try:
            data = read_json(root / name)
            if not isinstance(data, dict):
                raise ValueError('must contain an object')
            check(data.get('schema_version') == 1, f'{name}: schema_version must be 1')
            return data
        except (OSError, ValueError) as exc:
            errors.append(f'{name}: {exc}')
            return {}

    def evidence_ref(value, label):
        if not isinstance(value, str) or not value.strip():
            errors.append(f'{label}: expected a non-empty relative evidence path')
            return
        path = Path(value)
        resolved = (root / path).resolve()
        check(not path.is_absolute() and resolved.is_relative_to(root.resolve()),
              f'{label}: evidence must stay within .ai/migration')
        check(resolved.is_file(), f'{label}: missing evidence file: {value}')

    def refs(value, label, require=False):
        if not isinstance(value, list):
            errors.append(f'{label}: expected a list')
            return
        if require:
            check(bool(value), f'{label}: at least one evidence reference required')
        for item in value:
            evidence_ref(item, label)

    def nonempty_list(value, label):
        check(isinstance(value, list) and bool(value) and all(isinstance(x, str) and x.strip() for x in value),
              f'{label}: expected a non-empty list of strings')

    check(root.is_dir(), 'Migration directory does not exist; initialize first.')
    check(not (root / 'INITIALIZATION_INCOMPLETE.txt').exists(), 'Initialization is incomplete; inspect its failure before continuing.')
    configuration = load('PROJECT.json')
    authority = load('AUTHORITY.json')
    state = load('STATE.json')
    register = load('FEATURES.json')
    for key in ('project_name', 'objective', 'legacy_root', 'target_root'):
        check(isinstance(configuration.get(key), str) and bool(configuration.get(key, '').strip()), f'PROJECT.json: {key} required')
    profiles = configuration.get('profiles')
    check(isinstance(profiles, list) and bool(profiles) and all(p in PROFILES for p in profiles), 'PROJECT.json: invalid profiles')
    check(isinstance(authority.get('grants'), list), 'AUTHORITY.json: grants must be a list')
    for grant in authority.get('grants', []) if isinstance(authority.get('grants'), list) else []:
        if not isinstance(grant, dict):
            errors.append('AUTHORITY.json: each grant must be an object')
            continue
        for key in ('id', 'action', 'environment', 'scope', 'source_of_user_authorization'):
            check(isinstance(grant.get(key), str) and bool(grant.get(key, '').strip()), f'Authority grant: {key} required')
    check(state.get('status') in RUN_STATUS, 'STATE.json: invalid status')
    check(state.get('milestone') in MILESTONES, 'STATE.json: invalid milestone')
    check(state.get('active_stage') in {f'{n:02d}' for n in range(14)}, 'STATE.json: invalid active_stage')
    stages = state.get('stages', [])
    if not isinstance(stages, list):
        stages = []
        errors.append('STATE.json: stages must be a list')
    stage_by_id = {}
    for stage in stages:
        if not isinstance(stage, dict):
            errors.append('STATE.json: each stage must be an object')
            continue
        sid = stage.get('id')
        if not isinstance(sid, str):
            errors.append('STATE.json: stage id must be a string')
            continue
        check(sid not in stage_by_id, f'Duplicate stage ID: {sid}')
        stage_by_id[sid] = stage
        check(stage.get('status') in STAGE_STATUS, f'Stage {sid}: invalid status')
        if stage.get('status') in {'PASSED', 'NOT_APPLICABLE'}:
            evidence_ref(stage.get('report'), f'Stage {sid} report')
            refs(stage.get('evidence'), f'Stage {sid} evidence', require=True)
        if stage.get('status') == 'NOT_APPLICABLE':
            check(sid == '04', f'Stage {sid}: only UI discovery may be wholly N/A; adapt other stages to scope')
            check(isinstance(stage.get('reason'), str) and bool(stage.get('reason', '').strip()), f'Stage {sid}: N/A reason required')
    check(set(stage_by_id) == {f'{n:02d}' for n in range(14)}, 'STATE.json: stages 00 through 13 must each appear once')
    features = register.get('features', [])
    if not isinstance(features, list):
        features = []
        errors.append('FEATURES.json: features must be a list')
    seen = set()
    for feature in features:
        if not isinstance(feature, dict):
            errors.append('FEATURES.json: feature must be an object')
            continue
        fid = feature.get('id')
        if not isinstance(fid, str) or not fid.strip():
            errors.append('Feature requires a non-empty string ID')
            continue
        check(fid not in seen, f'Duplicate feature ID: {fid}')
        seen.add(fid)
        check(feature.get('status') in FEATURE_STATUS, f'{fid}: invalid status')
        check(feature.get('disposition') in {'preserve', 'change', 'retire', 'unresolved'}, f'{fid}: invalid disposition')
        if feature.get('disposition') in {'change', 'retire'}:
            check(isinstance(feature.get('decision_id'), str) and bool(feature.get('decision_id', '').strip()), f'{fid}: deviation requires decision_id')
        ev = feature.get('evidence', {})
        if not isinstance(ev, dict):
            ev = {}
            errors.append(f'{fid}: evidence must be an object')
        refs(ev.get('legacy', []), f'{fid} legacy evidence')
        refs(ev.get('target', []), f'{fid} target evidence', require=feature.get('status') == 'VERIFIED')
        if feature.get('status') == 'VERIFIED':
            nonempty_list(feature.get('acceptance_criteria'), f'{fid} acceptance_criteria')
            nonempty_list(feature.get('test_ids'), f'{fid} test_ids')
            check(isinstance(feature.get('verified_revision'), str) and bool(feature.get('verified_revision', '').strip()), f'{fid}: verified_revision required')
            check(feature.get('disposition') in {'preserve', 'change'}, f'{fid}: verified feature must have preserve/change disposition')
        if feature.get('status') == 'RETIRED':
            check(feature.get('disposition') == 'retire', f'{fid}: RETIRED requires retire disposition')
    milestone = state.get('milestone')
    if milestone in MILESTONES - {'NONE'}:
        check(bool(features), 'Release/completion milestone requires a non-empty feature inventory')
        for feature in features:
            if isinstance(feature, dict):
                check(feature.get('status') in {'VERIFIED', 'RETIRED'}, f"Milestone has unfinished feature: {feature.get('id')}")
        end = 11 if milestone in {'READY_FOR_RELEASE', 'DEPLOYED'} else 13
        for number in range(end + 1):
            sid = f'{number:02d}'
            check(stage_by_id.get(sid, {}).get('status') in {'PASSED', 'NOT_APPLICABLE'}, f'{milestone}: stage {sid} must pass')
        if milestone == 'DEPLOYED':
            refs(state.get('deployment_evidence'), 'STATE deployment_evidence', require=True)
        if milestone == 'LEGACY_RETIRED':
            refs(state.get('retirement_evidence'), 'STATE retirement_evidence', require=True)
    if state.get('status') == 'COMPLETE':
        check(milestone in {'MIGRATION_COMPLETE', 'LEGACY_RETIRED'}, 'COMPLETE requires a completed migration milestone')
    for name in ('INDEX.md', 'DECISIONS.md', 'RISKS_AND_UNKNOWNS.md', 'framework/MASTER.md'):
        check((root / name).is_file(), f'Missing required file: {name}')
    if errors:
        print('Structural validation failed:')
        for error in errors:
            print(f'- {error}')
        return 1
    print('Structural validation passed. Application correctness, scope completeness, authorization authenticity, and release readiness were NOT independently verified by this tool.')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    initialize = commands.add_parser('init', help='Create project records without overwriting existing state')
    initialize.add_argument('--project-root', required=True)
    initialize.add_argument('--legacy-root', required=True)
    initialize.add_argument('--profile', choices=PROFILES, default='generic')
    initialize.add_argument('--objective', required=True)
    initialize.set_defaults(handler=init)
    verifier = commands.add_parser('validate', help='Check record structure and local evidence references')
    verifier.add_argument('--project-root', default='.')
    verifier.set_defaults(handler=validate)
    args = parser.parse_args()
    try:
        return args.handler(args)
    except (OSError, ValueError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
